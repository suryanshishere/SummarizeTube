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
exports.deleteAllSummaryHistory = exports.getUserSummaryHistory = exports.youtubeUrlResponse = void 0;
const http_errors_1 = __importDefault(require("../../utils/http-errors"));
const user_model_1 = __importDefault(require("../../models/user-model"));
const validation_error_1 = require("../validation-error");
const mongoose_1 = __importDefault(require("mongoose"));
const youtube_summary_utils_1 = require("./youtube-summary-utils");
const youtubeUrlResponse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        (0, validation_error_1.handleValidationErrors)(req, next);
        const { youtubeUrl } = req.body;
        const userId = req.userData.userId;
        if (!youtubeUrl) {
            return res.status(400).json({ message: "YouTube URL is required." });
        }
        const user = yield user_model_1.default.findById(userId).session(session);
        if (!user)
            return next(new http_errors_1.default("User not found!", 404));
        const transcript = yield (0, youtube_summary_utils_1.getYoutubeTranscript)(youtubeUrl);
        if (!transcript || transcript.length === 0)
            return next(new http_errors_1.default("Transcript is not found, try another english subtle video.", 404));
        // Call the Gemini API to get the summary
        const summary = yield (0, youtube_summary_utils_1.summarizeTranscript)(transcript, process.env.GEMINI_API_KEY);
        // Merge the new summary with the existing history
        user.summarize_history = [...summary, ...(user.summarize_history || [])];
        // Save the user data with the updated summarize_history, using session
        yield user.save({ session });
        // Commit the transaction if everything is successful
        yield session.commitTransaction();
        res.status(200).json({
            message: "Transcript summarized successfully!",
            summary,
        });
    }
    catch (error) {
        // If any error occurs, abort the transaction
        if (session.inTransaction()) {
            yield session.abortTransaction();
        }
        console.error(error);
        // Propagate the error to the client with detailed message and status code
        const errorMessage = error instanceof http_errors_1.default
            ? error.message
            : "Fetching YouTube summary failed, try again!";
        const statusCode = error instanceof http_errors_1.default ? error.code : 500;
        return res.status(statusCode).json({
            message: errorMessage,
        });
    }
    finally {
        // End the session
        session.endSession();
    }
});
exports.youtubeUrlResponse = youtubeUrlResponse;
const getUserSummaryHistory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userData.userId;
        const user = yield user_model_1.default.findById(userId, "summarize_history");
        if (!user) {
            return next(new http_errors_1.default("User not found! Try login again or create new account.", 404));
        }
        return res.status(200).json({
            message: "User summary history fetched successfully",
            data: user.summarize_history || [],
        });
    }
    catch (error) {
        return next(new http_errors_1.default("Fetching summary history failed, try again later!", 500));
    }
});
exports.getUserSummaryHistory = getUserSummaryHistory;
const deleteAllSummaryHistory = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userData.userId;
        // Update the user and set summarize_history to an empty array
        const user = yield user_model_1.default.findByIdAndUpdate(userId, { $set: { summarize_history: [] } }, { new: true });
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
    }
    catch (error) {
        // Handle any errors
        return next(error);
    }
});
exports.deleteAllSummaryHistory = deleteAllSummaryHistory;
