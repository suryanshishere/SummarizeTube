import HttpError from "@utils/http-errors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

export const getYoutubeTranscript = async (url: string): Promise<string> => {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
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
      throw new HttpError(
        "Transcript not found, another youtube video url!",
        400
      );
    }

    return response.data[0].transcriptionAsText;
  } catch (error: any) {
    console.error("Error fetching transcript:", error.response?.data?.message);
    throw new HttpError("Transcript not found!", 500);
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

export const summarizeTranscript = async (
  transcript: string,
  apiKey: string
): Promise<string> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `${transcript} Summarise into points.`;
  const result = await model.generateContent(prompt);
  return result.response?.text() ?? "No summary generated.";
};
