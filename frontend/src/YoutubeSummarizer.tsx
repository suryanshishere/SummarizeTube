import React, { useState } from "react";
import Button from "shared/Button";
import { TextArea } from "shared/Input";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/index";
import { triggerErrorMsg, triggerSuccessMsg } from "store/response-thunk";
import axiosInstance from "shared/axios-instance";
import RenderSummary from "RenderSummary";

// Validation schema for the YouTube URL
const validationSchema = yup.object().shape({
  youtubeUrl: yup
    .string()
    .url("Please enter a valid URL")
    .matches(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      "Please enter a valid YouTube URL"
    )
    .required("YouTube URL is required"),
});

// Interface for form inputs
interface IYouTubeForm {
  youtubeUrl: string;
}

const YoutubeSummarizer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [summaryHistory, setSummaryHistory] = useState<string[]>([]); // State for summary history

  // Setup form with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IYouTubeForm>({
    resolver: yupResolver(validationSchema),
    mode: "onSubmit",
  });

  // Mutation for fetching the YouTube summary
  const summaryMutation = useMutation({
    mutationFn: async (data: IYouTubeForm) => {
      const response = await axiosInstance.post(
        `/get-summary`,
        JSON.stringify(data)
      );
      return response.data;
    },
    onSuccess: ({ summary, message }) => {
      dispatch(triggerSuccessMsg(message));
      console.log("Video Summary:", summary);

      // Add the summary to the history list
      setSummaryHistory((prevHistory) => [summary, ...prevHistory]);
    },
    onError: (error: any) => {
      dispatch(
        triggerErrorMsg(
          error.response?.data?.message || "Failed to fetch summary"
        )
      );
    },
    retry: 2,
  });

  // Form submission handler
  const onSubmit: SubmitHandler<IYouTubeForm> = (data) => {
    summaryMutation.mutate(data);
  };

  return (
    <div className="w-full h-full flex flex-col items-center overflow-y-auto bg-custom-white">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-1/2 flex flex-col gap-2 "
      >
        <YouTubeIcon
          className="self-center text-custom-red"
          style={{ height: "12rem", width: "12rem" }}
        />
        <TextArea
          label="Paste your YouTube video URL"
          error={!!errors.youtubeUrl}
          helperText={errors.youtubeUrl?.message}
          placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          classProp="placeholder:text-sm outline-custom-green"
          {...register("youtubeUrl")}
        />
        <Button
          type="submit"
          authButtonType
          disabled={summaryMutation.isPending}
          classProp={`${
            summaryMutation.isPending ? "bg-custom-black" : "bg-custom-gray"
          } py-3`}
        >
          {summaryMutation.isPending ? "Fetching Summary..." : "Get Summary"}
        </Button>
      </form>
 
      <div className="mt-4 w-full">
        {summaryHistory.length > 0 && (
          <div className="bg-custom-white p-4 rounded shadow-md mt-4">
            <h3 className="text-2xl text-center mb-4 font-semibold">
              Summary History
            </h3>
            <ul>
              {summaryHistory.map((summary, index) => {
                return (
                  <li
                    key={index}
                    className="bg-custom-light-gray p-4 mb-4 rounded shadow"
                  >
                    <div className="text-md text-gray-700">
                      <RenderSummary summaryHistory={summary} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default YoutubeSummarizer;
