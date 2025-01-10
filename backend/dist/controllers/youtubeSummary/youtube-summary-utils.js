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
exports.summarizeTranscript = exports.getYoutubeTranscript = void 0;
const http_errors_1 = __importDefault(require("../../utils/http-errors"));
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const getYoutubeTranscript = (url) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
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
        const response = yield axios_1.default.request(options);
        if (!response.data[0]) {
            throw new http_errors_1.default("Transcript not found, another youtube video url!", 400);
        }
        return response.data[0].transcriptionAsText;
    }
    catch (error) {
        console.error("Error fetching transcript:", (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message);
        throw new http_errors_1.default("Transcript not found!", 500);
    }
});
exports.getYoutubeTranscript = getYoutubeTranscript;
const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    if (match && match[1]) {
        return match[1];
    }
    console.error("Invalid YouTube URL: Could not extract video ID");
    throw new http_errors_1.default("Invalid YouTube URL", 400);
};
const summarizeTranscript = (transcript, apiKey) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `${transcript} Summarise into points.`;
    const result = yield model.generateContent(prompt);
    return (_b = (_a = result.response) === null || _a === void 0 ? void 0 : _a.text()) !== null && _b !== void 0 ? _b : "No summary generated.";
});
exports.summarizeTranscript = summarizeTranscript;
