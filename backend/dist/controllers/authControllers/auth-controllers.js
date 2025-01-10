"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.sendVerificationOtp = exports.resetPassword = exports.sendPasswordResetLink = exports.auth = void 0;
const http_errors_1 = __importDefault(require("../../utils/http-errors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const send_email_1 = __importDefault(require("./send-email"));
const user_model_1 = __importDefault(require("../../models/user-model"));
const auth_controllers_utils_1 = require("./auth-controllers-utils");
const validation_error_1 = __importDefault(require("../validation-error"));
const check_auth_1 = require("../../middleware/check-auth");
const lodash_1 = require("lodash");
const express_validator_1 = require("express-validator");
const env_data_1 = require("../../shared/env.data");
const FRONTEND_URL = `${process.env.FRONTEND_URL}/user/reset_password` ||
    "http://localhost:3000/user/reset_password";
const { EMAIL_VERIFICATION_OTP_EXPIRY, PASSWORD_RESET_TOKEN_EXPIRY } = env_data_1.USER_ENV_DATA;
const auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new http_errors_1.default((0, validation_error_1.default)(errors), 400));
    }
    const { email, password } = req.body;
    const existingUser = yield user_model_1.default.findOne({ email });
    try {
        if (existingUser) {
            const isValidPassword = yield bcryptjs_1.default.compare(password, existingUser.password);
            if (!existingUser.isEmailVerified) {
                yield (0, auth_controllers_utils_1.updateUnverifiedUser)(existingUser, password);
                return (0, auth_controllers_utils_1.sendVerificationResponse)(req, res, next, existingUser);
            }
            if (!isValidPassword) {
                return next(new http_errors_1.default("Invalid credentials, could not log you in.", 401));
            }
            return (0, auth_controllers_utils_1.sendAuthenticatedResponse)(res, existingUser);
        }
        else {
            const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
            const newUser = new user_model_1.default({
                email,
                password: hashedPassword,
                emailVerificationToken: (0, lodash_1.random)(100000, 999999),
                emailVerificationTokenCreatedAt: new Date()
            });
            yield newUser.save();
            return (0, auth_controllers_utils_1.sendVerificationResponse)(req, res, next, newUser);
        }
    }
    catch (err) {
        console.log(err);
        return next(new http_errors_1.default("Authentication failed, please try again.", 500));
    }
});
exports.auth = auth;
//forgot password
const sendPasswordResetLink = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new http_errors_1.default((0, validation_error_1.default)(errors), 400));
    }
    const { email } = req.body;
    const userId = (0, check_auth_1.getUserIdFromRequest)(req);
    try {
        let existingUser;
        if (userId) {
            existingUser = yield user_model_1.default.findById(userId);
        }
        else {
            existingUser = yield user_model_1.default.findOne({ email });
        }
        if (!existingUser || !existingUser.isEmailVerified) {
            return next(new http_errors_1.default("User not found!", 404));
        }
        if (userId && existingUser.email !== email) {
            return next(new http_errors_1.default("User does not match the provided email!", 404));
        }
        //check too many request to prevent reset link send to email
        const delayInSeconds = existingUser.passwordResetTokenCreatedAt
            ? (0, auth_controllers_utils_1.checkRequestDelay)(existingUser.passwordResetTokenCreatedAt, 60)
            : null;
        if (delayInSeconds !== null) {
            return next(new http_errors_1.default(`Please wait ${delayInSeconds} second(s) or use the last reset link.`, 429, delayInSeconds));
        }
        existingUser.passwordResetToken = (0, lodash_1.random)(100000, 999999);
        existingUser.passwordResetTokenCreatedAt = new Date();
        yield existingUser.save();
        yield (0, send_email_1.default)(next, existingUser.email, "Reset your password (Valid for 3min)", `${FRONTEND_URL}/${existingUser.id + existingUser.passwordResetToken}`);
        return res
            .status(200)
            .json({ message: "Reset password link sent successfully." });
    }
    catch (err) {
        return next(new http_errors_1.default("An error occurred while sending the reset link. Please try again later.", 500));
    }
});
exports.sendPasswordResetLink = sendPasswordResetLink;
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new http_errors_1.default((0, validation_error_1.default)(errors), 400));
    }
    const { resetPasswordToken, password } = req.body;
    const { userId } = req.params;
    try {
        // Find user and validate existence and email verification
        const existingUser = yield user_model_1.default.findById(userId);
        if (!existingUser || !existingUser.isEmailVerified) {
            return next(new http_errors_1.default("User not found or email not verified!", 404));
        }
        // Check if password reset was requested and valid token exists
        if (!existingUser.passwordResetToken ||
            !existingUser.passwordResetTokenCreatedAt) {
            return next(new http_errors_1.default("No password reset request found. Please initiate a new password reset request.", 400));
        }
        // Validate provided reset token
        if (!resetPasswordToken ||
            existingUser.passwordResetToken !== resetPasswordToken) {
            return next(new http_errors_1.default("Invalid reset token", 400));
        }
        // Validate token expiration (3 minutes)
        const tokenExpirationTime = new Date(existingUser.passwordResetTokenCreatedAt.getTime() +
            PASSWORD_RESET_TOKEN_EXPIRY * 60 * 1000);
        const currentTime = new Date();
        if (currentTime > tokenExpirationTime) {
            return next(new http_errors_1.default("Reset token has expired. Please request a new password reset link.", 410));
        }
        // Hash new password
        let hashedPassword;
        try {
            hashedPassword = yield bcryptjs_1.default.hash(password, 12);
        }
        catch (err) {
            return next(new http_errors_1.default("Failed to reset password. Please try again later.", 500));
        }
        // Check if new password is similar to the old one (before updating)
        const isPasswordSimilar = yield bcryptjs_1.default.compare(password, existingUser.password);
        if (isPasswordSimilar) {
            return next(new http_errors_1.default("The new password cannot be the same as your current password. Please choose a different password or log in to update your credentials in the settings.", 400 // Bad Request
            ));
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
        yield existingUser.save();
        return res.status(200).json({ message: "Password updated successfully." });
    }
    catch (error) {
        return next(new http_errors_1.default("An unexpected error occurred. Please try again later.", 500));
    }
});
exports.resetPassword = resetPassword;
//authenticated
const sendVerificationOtp = (req_1, res_1, next_1, ...args_1) => __awaiter(void 0, [req_1, res_1, next_1, ...args_1], void 0, function* (req, res, next, options = {}) {
    if (!options.isDirect) {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return next(new http_errors_1.default((0, validation_error_1.default)(errors), 400));
        }
    }
    // optional routes: since in backend action won't have token hence conditional not workin
    const userId = options.isDirect
        ? options.userId
        : (0, check_auth_1.getUserIdFromRequest)(req);
    try {
        let user = null;
        if (!options.email) {
            user = yield user_model_1.default.findById(userId);
            if (!user) {
                return next(new http_errors_1.default("User not found!", 404));
            }
            else if (user.isEmailVerified) {
                return next(new http_errors_1.default("User email already verified!", 409));
            }
        }
        const delayInSeconds = (0, auth_controllers_utils_1.checkRequestDelay)(user === null || user === void 0 ? void 0 : user.emailVerificationTokenCreatedAt, 60);
        if (delayInSeconds !== null) {
            return next(new http_errors_1.default("Please wait for " +
                delayInSeconds +
                " second(s) or verify your last OTP sent", 429, delayInSeconds));
        }
        const emailToSend = options.email || (user === null || user === void 0 ? void 0 : user.email);
        if (!emailToSend) {
            return next(new http_errors_1.default("Email address is required!", 400));
        }
        // Generate a verification token and set expiration
        const verificationToken = options.token
            ? options.token
            : (0, lodash_1.random)(100000, 999999);
        if (user) {
            user.emailVerificationToken = verificationToken;
            user.emailVerificationTokenCreatedAt = new Date();
            yield user.save();
        }
        // Define email content
        const emailSubject = "Verify your email through OTP (Valid for 3min)";
        const emailContent = `${verificationToken}`;
        // Send email
        yield (0, send_email_1.default)(next, emailToSend, emailSubject, emailContent);
        // If `isDirect`, skip the response
        if (options.isDirect)
            return;
        // Respond to client
        res.status(200).json({
            message: "OTP sent to your email successfully",
        });
    }
    catch (error) {
        return next(new http_errors_1.default("Error sending verification email, try again later", 500));
    }
});
exports.sendVerificationOtp = sendVerificationOtp;
const verifyEmail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate request
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new http_errors_1.default((0, validation_error_1.default)(errors), 400));
    }
    const { otp } = req.body;
    const userId = req.userData.userId;
    try {
        // Find the user by ID and validate existence
        const existingUser = yield user_model_1.default.findById(userId);
        if (!existingUser) {
            return next(new http_errors_1.default("User not found! Please sign up again.", 404));
        }
        // Verify the existence of the OTP and its creation date
        if (!existingUser.emailVerificationToken ||
            !existingUser.emailVerificationTokenCreatedAt) {
            return next(new http_errors_1.default("OTP verification was not requested. Please resend the OTP and try again.", 400));
        }
        // Validate OTP
        if (existingUser.emailVerificationToken !== otp) {
            return next(new http_errors_1.default("Invalid OTP. Please try again.", 400));
        }
        // Check if the OTP has expired (e.g., 15 minutes)
        const tokenExpirationTime = new Date(existingUser.emailVerificationTokenCreatedAt.getTime() +
            EMAIL_VERIFICATION_OTP_EXPIRY * 60 * 1000);
        const currentTime = new Date();
        if (currentTime > tokenExpirationTime) {
            return next(new http_errors_1.default("The OTP has expired. Please request a new verification email.", 410));
        }
        // Mark email as verified and clear the verification token data
        existingUser.isEmailVerified = true;
        existingUser.emailVerificationToken = undefined;
        existingUser.emailVerificationTokenCreatedAt = undefined;
        yield existingUser.save();
        return res
            .status(200)
            .json({ message: "Your email has been successfully verified." });
    }
    catch (error) {
        return next(new http_errors_1.default("An unexpected error occurred. Please try again later.", 500));
    }
});
exports.verifyEmail = verifyEmail;
