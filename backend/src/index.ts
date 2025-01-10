import "module-alias/register";
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import { deleteAllSummaryHistory, getUserSummaryHistory, youtubeUrlResponse } from "@controllers/youtubeSummary/youtube-summary-controllers";
import HttpError from "@utils/http-errors";
import checkAuth from "@middleware/check-auth";
import dotenv from "dotenv";
dotenv.config();
import authRoutes from "@routes/authRoutes/auth-routes";

const MONGO_URL: string = process.env.MONGO_URL || "";
const LOCAL_HOST = process.env.LOCAL_HOST || 5050;

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(checkAuth);

app.use("/api/auth", authRoutes);
app.post("/api/get-summary", youtubeUrlResponse);
app.get("/api/get-summary-history", getUserSummaryHistory)
app.delete("/api/delete-summary-history",deleteAllSummaryHistory)

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
