import { Request, Response, NextFunction } from "express";
import axios from "axios";
import HttpError from "@utils/http-errors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { JWTRequest } from "@middleware/check-auth";
import UserModal from "@models/user-model";
import { handleValidationErrors } from "@controllers/validation-error";
import mongoose from "mongoose";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;

export const getYoutubeTranscript = async (url: string): Promise<string> => {
  try {
    const videoId = extractVideoId(url);
    const options = {
      method: "GET",
      url: "https://youtube-transcriptor.p.rapidapi.com/transcript",
      params: {
        video_id: videoId,
        lang: "en",
      },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "youtube-transcriptor.p.rapidapi.com",
      },
    };
    const response = await axios.request(options);

    if (!response.data[0]) {
      throw new HttpError("Transcript not found", 400);
    }

    return response.data[0].transcriptionAsText;
  } catch (error: any) {
    console.error("Error fetching transcript:", error.message);
    throw new HttpError(
      error.response?.data?.message || "Failed to fetch transcript",
      500
    );
  }
};

const extractVideoId = (url: string): string => {
  const regex =
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  console.error("Invalid YouTube URL: Could not extract video ID");
  throw new HttpError("Invalid YouTube URL", 400);
};

const summarizeTranscript = async (
  transcript: string,
  apiKey: string
): Promise<string> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `${transcript} Summarise into points.`;
  const result = await model.generateContent(prompt);
  return result.response?.text() ?? "No summary generated.";
};

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

    const user = await UserModal.findById(userId).session(session); // Use session to ensure atomic operations
    if (!user) return next(new HttpError("User not found!", 404));

    const transcript = await getYoutubeTranscript(youtubeUrl);

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
    next(new HttpError("Fetching YouTube summary failed, try again!", 500));
  } finally {
    // End the session
    session.endSession();
  }
};
