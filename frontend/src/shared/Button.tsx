import React, { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  onClick?: () => void;
  tick?: boolean;
  classProp?: string;
  type?: "button" | "submit" | "reset";
  outline?: boolean;
  // href?: string;
  // commonLoading?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  loginSignupType?: boolean;
  authButtonType?: boolean;
  warning?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  classProp,
  style,
  // commonLoading,
  disabled,
  type = "button",
  onClick,
  // outline,
  loginSignupType,
  authButtonType,
  warning,
}) => {
  if (loginSignupType) {
    return (
      <button
        type={type}
        style={{ cursor: disabled ? "default" : "", ...style }}
        disabled={disabled}
        onClick={onClick}
        className={`relative inline-block font-medium group ${classProp}`}
      >
        <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-black group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
        <span className="absolute inset-0 w-full h-full bg-custom-red border-2 border-black group-hover:bg-custom-red"></span>
        <span className="relative text-custom-white group-hover:text-white">
          {children}
        </span>
      </button>
    );
  }

  if (authButtonType) {
    return (
      <button
        onClick={onClick}
        type={type}
        style={{ cursor: disabled ? "default" : "", ...style }}
        disabled={disabled}
        className={`flex items-center justify-center min-w-fit whitespace-nowrap text-base overflow-hidden py-2 rounded-full text-custom-white font-bold px-3 hover:bg-custom-black ${
          classProp || "bg-custom-gray"
        }`}
      >
        {children}
      </button>
    );
  }

  if (warning) {
    return (
      <button
        onClick={onClick}
        type={type}
        style={{ cursor: disabled ? "default" : "", ...style }}
        disabled={disabled}
        className={`text-custom-red  flex items-center justify-center rounded outline outline-custom-red p-button hover:text-custom-white hover:bg-custom-red min-w-fit whitespace-nowrap px-button-x py-button-y text-base overflow-hidden ${classProp}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      type={type}
      style={{ cursor: disabled ? "default" : "", ...style }}
      disabled={disabled}
      className={`flex items-center justify-center ${
        classProp?.includes("rounded") ? "" : "rounded"
      } outline outline-custom-super-less-gray p-button hover:bg-custom-super-less-gray min-w-fit whitespace-nowrap px-button-x py-button-y text-base overflow-hidden ${classProp}`}
    >
      {children}
    </button>
  );
};

export default Button;
