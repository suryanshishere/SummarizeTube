import { IUser } from "@models/user-model";
import { sendVerificationOtp } from "./auth-controllers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextFunction, Response, Request } from "express";
import { random } from "lodash";

const JWT_KEY = process.env.JWT_KEY || "";
const JWT_KEY_EXPIRY = process.env.JWT_KEY_EXPIRY || "15";
// const EMAIL_VERIFICATION_TOKEN_EXPIRY =
//   Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY) || 3;

// Update unverified user fields with new password and verification token
export const updateUnverifiedUser = async (user: IUser, password: string) => {
  user.password = await bcrypt.hash(password, 12);
  user.emailVerificationToken = random(100000, 999999);
  user.emailVerificationTokenCreatedAt = new Date();
  await user.save();
};

// Send verification response with token and expiration
export const sendVerificationResponse = async (
  req: Request,
  res: Response,
  next: NextFunction,
  user: IUser
) => {
  const options = {
    userId: user.id,
    email: user.email,
    token: user.emailVerificationToken,
    isDirect: true,
  };

  await sendVerificationOtp(req, res, next, options);

  return sendAuthenticatedResponse(res, user, false);
};

export const generateJWTToken = (
  userId: string,
  email: string,
  deactivatedAt?: Date
): string => {
  if (!JWT_KEY) {
    throw new Error("JWT_KEY environment variable is not defined!");
  }

  const expiryInMinutes = parseInt(JWT_KEY_EXPIRY, 10);
  if (isNaN(expiryInMinutes)) {
    throw new Error("JWT_KEY_EXPIRY must be a valid number!");
  }

  const payload = {
    userId,
    email,
    ...(deactivatedAt && { deactivated_at: deactivatedAt }),
  };

  return jwt.sign(payload, JWT_KEY, {
    expiresIn: `${expiryInMinutes}m`,
  });
};

// Revised checkRequestDelay function
export const checkRequestDelay = (
  tokenCreatedAt: Date | null | undefined,
  delayInSeconds: number
): number | null => {
  if (!tokenCreatedAt || isNaN(tokenCreatedAt.getTime())) {
    // If tokenCreatedAt is null, undefined, or invalid, treat as no delay needed
    return null;
  }
  // Check if tokenCreatedAt is a future date
  if (tokenCreatedAt > new Date()) {
    return null;
  }
  const timeElapsed = Date.now() - tokenCreatedAt.getTime();
  const delayInMilliseconds = delayInSeconds * 1000;

  if (timeElapsed < delayInMilliseconds) {
    return Math.ceil((delayInMilliseconds - timeElapsed) / 1000);
  }

  return null;
};

// Send authenticated response for verified users
export const sendAuthenticatedResponse = (
  res: Response,
  user: IUser,
  isEmailVerified: boolean = true
) => {
  const token = generateJWTToken(user.id, user.email );
  const tokenExpiration = new Date(
    Date.now() + Number(JWT_KEY_EXPIRY) * 60000
  ).toISOString();

  return res.status(200).json({
    // role: user.role,
    token,
    isEmailVerified,
    tokenExpiration: tokenExpiration,
    message: isEmailVerified
      ? "Logged in successfully!"
      : "An OTP verification being sent to your mail.",
  });
};