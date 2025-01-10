import React, {   useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import Button from "shared/Button";
import { Input } from "shared/Input";
import { useMutation } from "@tanstack/react-query"; 
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "store";
import { handleAuthClick, updateUserData } from "store/auth-slice";
import axiosInstance from "shared/axios-instance";
import { triggerErrorMsg, triggerSuccessMsg } from "store/response-thunk";

const otpSchema = Yup.object().shape({
  email_verification_otp: Yup.number()
    .required("OTP is required")
    .typeError("OTP must be a number")
    .test(
      "len",
      "OTP must be exactly 6 digits",
      (val) => val !== undefined && val.toString().length === 6
    )
    .test(
      "is-positive",
      "OTP must be a positive number",
      (val) => val !== undefined && val > 0
    ),
});

type OTPFormInputs = {
  email_verification_otp: number;
};

const EmailVerification = () => {
  const { token } = useSelector((state: RootState) => state.auth.userData);
  const isOtpSent = useSelector((state: RootState) => state.auth.isOtpSent);
  const [isSendOnce, setIsSendOnce] = useState<boolean>(isOtpSent);
  const dispatch = useDispatch<AppDispatch>();
  const [resendTimer, setResendTimer] = useState<number>(0);

  useEffect(() => {
    if (isOtpSent) {
      setResendTimer(60);
    }
  }, [isOtpSent]);

  useEffect(() => {
    if (resendTimer > 0) {
      const countdown = setInterval(
        () => setResendTimer((prev) => prev - 1),
        1000
      );
      return () => clearInterval(countdown);
    }
  }, [resendTimer]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormInputs>({
    resolver: yupResolver(otpSchema),
    mode: "onSubmit",
  });

  // Mutation for sending OTP email
  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(
        `/auth/send-verification-otp`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(triggerSuccessMsg(data.message, 10));
      if (!isSendOnce) {
        setIsSendOnce(true);
      }
      setResendTimer(60);
    },
    onError: (error: any) => {
      if (error.response.status === 429) {
        setResendTimer(error.response.data.extraData);
        setIsSendOnce(true);
      }
      dispatch(triggerErrorMsg(`${error.response?.data?.message}`));
    },
  });

  // Mutation for verifying OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (otp: number) => {
      const response = await axiosInstance.post(
        `/auth/verify-email`,
        { otp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(updateUserData({ isEmailVerified: true }));
      dispatch(handleAuthClick(false));
      dispatch(triggerSuccessMsg(data.message));
      window.location.reload();
    },
    onError: (error: any) => {
      dispatch(triggerErrorMsg(`${error.response?.data?.message}`));
    },
  });

  const handleOtpEmail = () => {
    sendOtpMutation.mutate();
  };

  const verifyOtp: SubmitHandler<OTPFormInputs> = async ({
    email_verification_otp,
  }) => {
    verifyOtpMutation.mutate(email_verification_otp);
  };

  return (
    <form
      onSubmit={handleSubmit(verifyOtp)}
      className="h-full flex-1 flex flex-col items-center gap-2 justify-center "
    >
      <div className="flex-wrap w-fit">
        {isSendOnce
          ? "Enter your OTP for verification, which was sent to your email "
          : "Generate OTP for verification on your email "}
        <span className="text-custom-red">
          {/* {email &&
            `${email.slice(0, 3)}***${email.slice(email.indexOf("@") - 2)}`} */}
        </span>
      </div>

      <div className="flex gap-2"> 
        {!isSendOnce ? (
          <Button
            authButtonType
            onClick={handleOtpEmail}
            disabled={sendOtpMutation.isPending}
            classProp={`${
              sendOtpMutation.isPending ? "bg-custom-black" : "bg-custom-gray"
            }`}
          >
            {sendOtpMutation.isPending ? "Generating..." : "Generate OTP"}
          </Button>
        ) : (
          <>
            <Input
              {...register("email_verification_otp")}
              error={!!errors.email_verification_otp}
              helperText={errors.email_verification_otp?.message}
              type="number"
              classProp="py-2 text-md rounded placeholder:text-sm min-w-[6rem] flex-1"
              placeholder="Enter OTP"
              outerClassProp="flex-1"
            />
            <Button
              authButtonType
              classProp={`${
                verifyOtpMutation.isPending
                  ? "bg-custom-black"
                  : "bg-custom-gray"
              }`}
              type="submit"
              disabled={verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
            </Button>
          </>
        )}
        {isSendOnce && (
          <Button
            authButtonType
            classProp={`${
              sendOtpMutation.isPending
                ? "bg-custom-black"
                : resendTimer > 0
                ? "bg-custom-super-less-gray"
                : "bg-custom-gray"
            } ml-2`}
            onClick={handleOtpEmail}
            disabled={resendTimer > 0 || sendOtpMutation.isPending}
          >
            {sendOtpMutation.isPending
              ? "Resending..."
              : resendTimer > 0
              ? `Resend (${resendTimer}s)`
              : "Resend"}
          </Button>
        )}
      </div>
    </form>
  );
};

export default EmailVerification;
