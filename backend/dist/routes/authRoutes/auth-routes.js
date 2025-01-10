"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controllers_1 = require("../../controllers/authControllers/auth-controllers");
const env_data_1 = require("../../shared/env.data");
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const { ALPHA_NUM_SPECIAL_CHAR, MIN_PWD_LENGTH, MAX_PWD_LENGTH, MIN_EMAIL_OTP, MAX_EMAIL_OTP, OTP_ERROR_MSG, } = env_data_1.USER_ENV_DATA;
// Route for authentication
router.post("/", [
    (0, express_validator_1.check)("email").trim().normalizeEmail().isEmail(),
    (0, express_validator_1.check)("password")
        .trim()
        .isLength({ min: Number(MIN_PWD_LENGTH), max: Number(MAX_PWD_LENGTH) }),
], auth_controllers_1.auth);
router.post("/send-verification-otp", auth_controllers_1.sendVerificationOtp);
// Route for verifying email
router.post("/verify-email", (0, express_validator_1.check)("otp")
    .isInt({ min: MIN_EMAIL_OTP, max: MAX_EMAIL_OTP })
    .withMessage(OTP_ERROR_MSG), auth_controllers_1.verifyEmail);
module.exports = router;
exports.default = router;
