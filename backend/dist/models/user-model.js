"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const env_data_1 = require("../shared/env.data");
const mongoose_1 = __importStar(require("mongoose"));
const { MIN_EMAIL_OTP, MAX_EMAIL_OTP, PWD_RESET_ERROR_MSG, OTP_ERROR_MSG, EMAIL_VERIFICATION_OTP_EXPIRY, PASSWORD_RESET_TOKEN_EXPIRY, } = env_data_1.USER_ENV_DATA;
const userSchema = new mongoose_1.Schema({
    // Authentication and verification fields
    //todo: add expire below
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: {
        type: Number,
        min: [MIN_EMAIL_OTP, OTP_ERROR_MSG],
        max: [MAX_EMAIL_OTP, OTP_ERROR_MSG],
        expires: EMAIL_VERIFICATION_OTP_EXPIRY * 60,
    },
    emailVerificationTokenCreatedAt: {
        type: Date,
        expires: PASSWORD_RESET_TOKEN_EXPIRY * 60,
    },
    passwordResetToken: {
        type: Number,
        min: [MIN_EMAIL_OTP, PWD_RESET_ERROR_MSG],
        max: [MAX_EMAIL_OTP, PWD_RESET_ERROR_MSG],
        expires: PASSWORD_RESET_TOKEN_EXPIRY * 60,
    },
    passwordResetTokenCreatedAt: {
        type: Date,
        expires: PASSWORD_RESET_TOKEN_EXPIRY * 60,
    },
    passwordChangedAt: { type: Date }, //todo
    // User identification fields
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    summarize_history: { type: [String] },
}, { timestamps: true });
const UserModal = mongoose_1.default.model("User", userSchema);
exports.default = UserModal;
