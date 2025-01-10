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
exports.sendAuthenticatedResponse = exports.checkRequestDelay = exports.generateJWTToken = exports.sendVerificationResponse = exports.updateUnverifiedUser = void 0;
const auth_controllers_1 = require("./auth-controllers");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const lodash_1 = require("lodash");
const JWT_KEY = process.env.JWT_KEY || "";
const JWT_KEY_EXPIRY = process.env.JWT_KEY_EXPIRY || "15";
// const EMAIL_VERIFICATION_TOKEN_EXPIRY =
//   Number(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY) || 3;
// Update unverified user fields with new password and verification token
const updateUnverifiedUser = (user, password) => __awaiter(void 0, void 0, void 0, function* () {
    user.password = yield bcryptjs_1.default.hash(password, 12);
    user.emailVerificationToken = (0, lodash_1.random)(100000, 999999);
    user.emailVerificationTokenCreatedAt = new Date();
    yield user.save();
});
exports.updateUnverifiedUser = updateUnverifiedUser;
// Send verification response with token and expiration
const sendVerificationResponse = (req, res, next, user) => __awaiter(void 0, void 0, void 0, function* () {
    const options = {
        userId: user.id,
        email: user.email,
        token: user.emailVerificationToken,
        isDirect: true,
    };
    yield (0, auth_controllers_1.sendVerificationOtp)(req, res, next, options);
    return (0, exports.sendAuthenticatedResponse)(res, user, false);
});
exports.sendVerificationResponse = sendVerificationResponse;
const generateJWTToken = (userId, email, deactivatedAt) => {
    if (!JWT_KEY) {
        throw new Error("JWT_KEY environment variable is not defined!");
    }
    const expiryInMinutes = parseInt(JWT_KEY_EXPIRY, 10);
    if (isNaN(expiryInMinutes)) {
        throw new Error("JWT_KEY_EXPIRY must be a valid number!");
    }
    const payload = Object.assign({ userId,
        email }, (deactivatedAt && { deactivated_at: deactivatedAt }));
    return jsonwebtoken_1.default.sign(payload, JWT_KEY, {
        expiresIn: `${expiryInMinutes}m`,
    });
};
exports.generateJWTToken = generateJWTToken;
// Revised checkRequestDelay function
const checkRequestDelay = (tokenCreatedAt, delayInSeconds) => {
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
exports.checkRequestDelay = checkRequestDelay;
// Send authenticated response for verified users
const sendAuthenticatedResponse = (res, user, isEmailVerified = true) => {
    const token = (0, exports.generateJWTToken)(user.id, user.email);
    const tokenExpiration = new Date(Date.now() + Number(JWT_KEY_EXPIRY) * 60000).toISOString();
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
exports.sendAuthenticatedResponse = sendAuthenticatedResponse;
