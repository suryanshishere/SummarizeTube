import { Request, Response, NextFunction } from "express";
import HttpError from "@utils/http-errors";
import { JWTRequest } from "@middleware/check-auth";
import UserModal from "@models/user-model";
import { handleValidationErrors } from "@controllers/validation-error";
import mongoose from "mongoose";
import {
  getYoutubeTranscript,
  summarizeTranscript,
} from "./youtube-summary-utils";

export const youtubeUrlResponse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = await mongoose.startSession(); // Start a new session
  try {
    session.startTransaction(); // Start the transaction

    handleValidationErrors(req, next);
    const { youtubeUrl } = req.body;
    const userId = (req as JWTRequest).userData.userId;

    if (!youtubeUrl) {
      return res.status(400).json({ message: "YouTube URL is required." });
    }

    const user = await UserModal.findById(userId).session(session);
    if (!user) return next(new HttpError("User not found!", 404));

    const transcript = await getYoutubeTranscript(youtubeUrl);

    if (!transcript || transcript.length === 0)
      return next(
        new HttpError(
          "Transcript is not found, try another english subtle video.",
          404
        )
      );

    // Call the Gemini API to get the summary
    const summary = await summarizeTranscript(
      transcript,
      process.env.GEMINI_API_KEY!
    );

    // Merge the new summary with the existing history
    user.summarize_history = [...summary, ...(user.summarize_history || [])];

    // Save the user data with the updated summarize_history, using session
    await user.save({ session });

    // Commit the transaction if everything is successful
    await session.commitTransaction();

    res.status(200).json({
      message: "Transcript summarized successfully!",
      summary,
    });
  } catch (error: any) {
    // If any error occurs, abort the transaction
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(error);
    // Propagate the error to the client with detailed message and status code
    const errorMessage = error instanceof HttpError ? error.message : "Fetching YouTube summary failed, try again!";
    const statusCode = error instanceof HttpError ? error.code : 500;
    
    return res.status(statusCode).json({
      message: errorMessage,
    });
  } finally {
    // End the session
    session.endSession();
  }
};

export const getUserSummaryHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as JWTRequest).userData.userId;

    const user = await UserModal.findById(userId, "summarize_history");

    if (!user) {
      return next(
        new HttpError(
          "User not found! Try login again or create new account.",
          404
        )
      );
    }

    return res.status(200).json({
      message: "User summary history fetched successfully",
      data: user.summarize_history || [],
    });
  } catch (error) {
    return next(
      new HttpError("Fetching summary history failed, try again later!", 500)
    );
  }
};

export const deleteAllSummaryHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as JWTRequest).userData.userId;

    // Update the user and set summarize_history to an empty array
    const user = await UserModal.findByIdAndUpdate(
      userId,
      { $set: { summarize_history: [] } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Respond to the client
    return res.status(200).json({
      success: true,
      message: "All summaries deleted successfully.",
    });
  } catch (error) {
    // Handle any errors
    return next(error);
  }
};
