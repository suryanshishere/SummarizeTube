import "module-alias/register";
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import { youtubeUrlResponse } from "@controllers/youtubeSummary/youtube-summary-controllers";
import HttpError from "@utils/http-errors";
import checkAuth from "@middleware/check-auth";
import { auth, verifyEmail } from "@controllers/authControllers/auth-controllers";
import { USER_ENV_DATA } from "./shared/env.data";
import { check } from "express-validator";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URL: string = process.env.MONGO_URL || "";
const LOCAL_HOST = process.env.LOCAL_HOST || 5050;
const {
    ALPHA_NUM_SPECIAL_CHAR,
    MIN_PWD_LENGTH,
    MAX_PWD_LENGTH,
    MIN_EMAIL_OTP,
    MAX_EMAIL_OTP,
    OTP_ERROR_MSG,
  } = USER_ENV_DATA;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(checkAuth);

app.post(
    "/verify-email",
    check("otp")
      .isInt({ min: MIN_EMAIL_OTP, max: MAX_EMAIL_OTP })
      .withMessage(OTP_ERROR_MSG),
    verifyEmail
  );
app.post("/api/auth",[
    check("email").trim().normalizeEmail().isEmail(),
    check("password")
      .trim()
      .isLength({ min: Number(MIN_PWD_LENGTH), max: Number(MAX_PWD_LENGTH) }),
  ], auth);


app.post("/api/get-summary", youtubeUrlResponse);

//Error showing if none of the routes found!
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new HttpError("Could not find this route.", 404));
});

//httperror middleware use here to return a valid json error instead any html error page
app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.code || 500;
  const errorMessage = error.message || "An unknown error occurred!";

  const response = {
    message: errorMessage,
    ...(error.extraData && { extraData: error.extraData }),
  };

  res.status(statusCode).json(response);
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(Number(LOCAL_HOST), () => {
      console.log(`Server is running on port ${LOCAL_HOST}`);
    });
  })
  .catch((err) => console.log(err));
