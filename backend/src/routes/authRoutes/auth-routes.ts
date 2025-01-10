import {
  auth,
  sendVerificationOtp,
  verifyEmail,
} from "@controllers/authControllers/auth-controllers";
import { USER_ENV_DATA } from "@shared/env.data";
import express from "express";
import { check } from "express-validator";

const router = express.Router();
const {
  ALPHA_NUM_SPECIAL_CHAR,
  MIN_PWD_LENGTH,
  MAX_PWD_LENGTH,
  MIN_EMAIL_OTP,
  MAX_EMAIL_OTP,
  OTP_ERROR_MSG,
} = USER_ENV_DATA;

// Route for authentication
router.post(
  "/",
  [
    check("email").trim().normalizeEmail().isEmail(),
    check("password")
      .trim()
      .isLength({ min: Number(MIN_PWD_LENGTH), max: Number(MAX_PWD_LENGTH) }),
  ],
  auth
);
router.post("/send-verification-otp", sendVerificationOtp);
// Route for verifying email
router.post(
  "/verify-email",
  check("otp")
    .isInt({ min: MIN_EMAIL_OTP, max: MAX_EMAIL_OTP })
    .withMessage(OTP_ERROR_MSG),
  verifyEmail
);

module.exports = router;
export default router;
