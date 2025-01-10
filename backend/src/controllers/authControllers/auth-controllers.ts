import { Response, NextFunction, Request } from "express";
import HttpError from "@utils/http-errors";
import bcrypt from "bcryptjs";
import sendEmail from "./send-email";
import  User, {IUser}  from "@models/user-model";
import {
  checkRequestDelay,
  sendAuthenticatedResponse,
  sendVerificationResponse,
  updateUnverifiedUser,
} from "./auth-controllers-utils";
import validationError from "../validation-error";
import { getUserIdFromRequest, JWTRequest } from "@middleware/check-auth";
import { random } from "lodash";
import { validationResult } from "express-validator";
import { USER_ENV_DATA } from "../../shared/env.data";

const FRONTEND_URL =
  `${process.env.FRONTEND_URL}/user/reset_password` ||
  "http://localhost:3000/user/reset_password";

const { EMAIL_VERIFICATION_OTP_EXPIRY, PASSWORD_RESET_TOKEN_EXPIRY } =
  USER_ENV_DATA;

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(validationError(errors), 400));
  }

  const { email, password } = req.body;
  const existingUser: IUser | null = await User.findOne({ email });
  try {
    if (existingUser) {
      const isValidPassword = await bcrypt.compare(
        password,
        existingUser.password as string
      );
      if (!existingUser.isEmailVerified) {
        await updateUnverifiedUser(existingUser, password);
        return sendVerificationResponse(req, res, next, existingUser);
      }
      if (!isValidPassword) {
        return next(
          new HttpError("Invalid credentials, could not log you in.", 401)
        );
      }
      return sendAuthenticatedResponse(res, existingUser);
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        email,
        password: hashedPassword,
        emailVerificationToken: random(100000, 999999),
        emailVerificationTokenCreatedAt: new Date()
      });
      await newUser.save();

      return sendVerificationResponse(req, res, next, newUser);
    }
  } catch (err) {
    console.log(err);
    return next(new HttpError("Authentication failed, please try again.", 500));
  }
};

//forgot password
export const sendPasswordResetLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(validationError(errors), 400));
  }
  const { email } = req.body;
  const userId = getUserIdFromRequest(req as JWTRequest);

  try {
    let existingUser: IUser | null;

    if (userId) {
      existingUser = await User.findById(userId);
    } else {
      existingUser = await User.findOne({ email });
    }

    if (!existingUser || !existingUser.isEmailVerified) {
      return next(new HttpError("User not found!", 404));
    }

    if (userId && existingUser.email !== email) {
      return next(
        new HttpError("User does not match the provided email!", 404)
      );
    }
    //check too many request to prevent reset link send to email
    const delayInSeconds = existingUser.passwordResetTokenCreatedAt
      ? checkRequestDelay(existingUser.passwordResetTokenCreatedAt, 60)
      : null;

    if (delayInSeconds !== null) {
      return next(
        new HttpError(
          `Please wait ${delayInSeconds} second(s) or use the last reset link.`,
          429,
          delayInSeconds
        )
      );
    }

    existingUser.passwordResetToken = random(100000, 999999);
    existingUser.passwordResetTokenCreatedAt = new Date();

    await existingUser.save();

    await sendEmail(
      next,
      existingUser.email,
      "Reset your password (Valid for 3min)",
      `${FRONTEND_URL}/${existingUser.id + existingUser.passwordResetToken}`
    );

    return res
      .status(200)
      .json({ message: "Reset password link sent successfully." });
  } catch (err) {
    return next(
      new HttpError(
        "An error occurred while sending the reset link. Please try again later.",
        500
      )
    );
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(validationError(errors), 400));
  }

  const { resetPasswordToken, password } = req.body;
  const { userId } = req.params;
  try {
    // Find user and validate existence and email verification
    const existingUser = await User.findById(userId);
    if (!existingUser || !existingUser.isEmailVerified) {
      return next(new HttpError("User not found or email not verified!", 404));
    }

    // Check if password reset was requested and valid token exists
    if (
      !existingUser.passwordResetToken ||
      !existingUser.passwordResetTokenCreatedAt
    ) {
      return next(
        new HttpError(
          "No password reset request found. Please initiate a new password reset request.",
          400
        )
      );
    }

    // Validate provided reset token
    if (
      !resetPasswordToken ||
      existingUser.passwordResetToken !== resetPasswordToken
    ) {
      return next(new HttpError("Invalid reset token", 400));
    }

    // Validate token expiration (3 minutes)
    const tokenExpirationTime = new Date(
      existingUser.passwordResetTokenCreatedAt.getTime() +
        PASSWORD_RESET_TOKEN_EXPIRY * 60 * 1000
    );
    const currentTime = new Date();

    if (currentTime > tokenExpirationTime) {
      return next(
        new HttpError(
          "Reset token has expired. Please request a new password reset link.",
          410
        )
      );
    }

    // Hash new password
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      return next(
        new HttpError("Failed to reset password. Please try again later.", 500)
      );
    }
    // Check if new password is similar to the old one (before updating)
    const isPasswordSimilar = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (isPasswordSimilar) {
      return next(
        new HttpError(
          "The new password cannot be the same as your current password. Please choose a different password or log in to update your credentials in the settings.",
          400 // Bad Request
        )
      );
    }

    // Update user password and clear reset data
    existingUser.password = hashedPassword;
    existingUser.passwordChangedAt = currentTime;
    existingUser.passwordResetToken = undefined;
    existingUser.passwordResetTokenCreatedAt = undefined;

    if (!existingUser.isEmailVerified) {
      existingUser.isEmailVerified = true;
      existingUser.emailVerificationToken = undefined;
      existingUser.emailVerificationTokenCreatedAt = undefined;
    }

    await existingUser.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return next(
      new HttpError(
        "An unexpected error occurred. Please try again later.",
        500
      )
    );
  }
};

//authenticated
export const sendVerificationOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
  options: {
    userId?: string;
    email?: string;
    token?: number;
    isDirect?: boolean;
  } = {}
) => {
  if (!options.isDirect) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new HttpError(validationError(errors), 400));
    }
  }
  // optional routes: since in backend action won't have token hence conditional not workin
  const userId = options.isDirect
    ? options.userId
    : getUserIdFromRequest(req as JWTRequest);

  try {
    let user: IUser | null = null;
    if (!options.email) {
      user = await User.findById(userId);
      if (!user) {
        return next(new HttpError("User not found!", 404));
      } else if (user.isEmailVerified) {
        return next(new HttpError("User email already verified!", 409));
      }
    }

    const delayInSeconds = checkRequestDelay(
      user?.emailVerificationTokenCreatedAt,
      60
    );

    if (delayInSeconds !== null) {
      return next(
        new HttpError(
          "Please wait for " +
            delayInSeconds +
            " second(s) or verify your last OTP sent",
          429,
          delayInSeconds
        )
      );
    }

    const emailToSend = options.email || user?.email;
    if (!emailToSend) {
      return next(new HttpError("Email address is required!", 400));
    }

    // Generate a verification token and set expiration
    const verificationToken = options.token
      ? options.token
      : random(100000, 999999);

    if (user) {
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenCreatedAt = new Date();
      await user.save();
    }

    // Define email content
    const emailSubject = "Verify your email through OTP (Valid for 3min)";
    const emailContent = `${verificationToken}`;

    // Send email
    await sendEmail(next, emailToSend, emailSubject, emailContent);

    // If `isDirect`, skip the response
    if (options.isDirect) return;

    // Respond to client
    res.status(200).json({
      message: "OTP sent to your email successfully",
    });
  } catch (error) {
    return next(
      new HttpError("Error sending verification email, try again later", 500)
    );
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(validationError(errors), 400));
  }

  const { otp } = req.body;
  const userId = (req as JWTRequest).userData.userId;

  try {
    // Find the user by ID and validate existence
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return next(new HttpError("User not found! Please sign up again.", 404));
    }

    // Verify the existence of the OTP and its creation date
    if (
      !existingUser.emailVerificationToken ||
      !existingUser.emailVerificationTokenCreatedAt
    ) {
      return next(
        new HttpError(
          "OTP verification was not requested. Please resend the OTP and try again.",
          400
        )
      );
    }

    // Validate OTP
    if (existingUser.emailVerificationToken !== otp) {
      return next(new HttpError("Invalid OTP. Please try again.", 400));
    }

    // Check if the OTP has expired (e.g., 15 minutes)
    const tokenExpirationTime = new Date(
      existingUser.emailVerificationTokenCreatedAt.getTime() +
      EMAIL_VERIFICATION_OTP_EXPIRY * 60 * 1000
    );
    const currentTime = new Date();

    if (currentTime > tokenExpirationTime) {
      return next(
        new HttpError(
          "The OTP has expired. Please request a new verification email.",
          410
        )
      );
    }

    // Mark email as verified and clear the verification token data
    existingUser.isEmailVerified = true;
    existingUser.emailVerificationToken = undefined;
    existingUser.emailVerificationTokenCreatedAt = undefined;

    await existingUser.save();
    return res
      .status(200)
      .json({ message: "Your email has been successfully verified." });
  } catch (error) {
    return next(
      new HttpError(
        "An unexpected error occurred. Please try again later.",
        500
      )
    );
  }
};