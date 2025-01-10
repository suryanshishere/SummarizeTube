import { startCase } from "lodash";
import React, { useState, ChangeEvent, CSSProperties, forwardRef } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  style?: CSSProperties;
  row?: number;
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  type?: string;
  classProp?: string;
  outerClassProp?: string;
  errorClassProp?: string;
}

// Forward ref to Input component
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      name,
      label,
      placeholder,
      required,
      type,
      style,
      value,
      onChange,
      error,
      helperText,
      classProp,
      outerClassProp,
      errorClassProp,
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prevShowPassword) => !prevShowPassword);
    };

    const endAdornment = (() => {
      if (type === "password") {
        return (
          <button
            type="button"
            className="p-0 hover:text-custom-red absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-custom-gray"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        );
      } else if (type === "search") {
        return (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
            🔍
          </span>
        );
      }
      return null;
    })();

    return (
      <div className={`${outerClassProp} flex flex-col`}>
        {label && (
          <label htmlFor={name} className="block text-sm font-medium mb-1">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          <input
            ref={ref}
            id={name}
            name={name}
            type={showPassword && type === "password" ? "text" : type}
            required={required}
            placeholder={placeholder || startCase(name)}
            value={value}
            onChange={onChange}
            className={`w-full pl-2 py-2 outline outline-2 focus:outline-custom-gray outline-custom-less-gray text-base rounded ${classProp} ${
              error ? "outline-custom-red" : ""
            } ${error ? "focus:ring-custom-red" : "focus:ring-custom-less-gray"}
            `}
            style={style}
          />
          {endAdornment && (
            <div className="absolute right-1 flex items-center h-full">
              {endAdornment}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={`ml-2 mt-[2px] bg-custom-white text-xs w-auto whitespace-nowrap ${
              error ? "text-custom-red" : "text-grey"
            } ${errorClassProp}`}
          >
            {helperText.replace(/_/g, " ")}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input"; // Optional: Set display name for better debugging

// TextArea Component
export const TextArea = forwardRef<
  HTMLTextAreaElement,
  Omit<InputProps, "onChange"> & {
    onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  }
>(
  (
    {
      name,
      required,
      value,
      onChange,
      row = 4,
      placeholder,
      disabled = false,
      error,
      helperText,
      classProp,
      outerClassProp,
      errorClassProp,
      label,
    },
    ref
  ) => {
    return (
      <div className={`relative ${outerClassProp}`}>
        <label htmlFor={name} className="block text-sm font-medium mb-1">
          {label ? label || startCase(placeholder) : startCase(name)}
        </label>
        <textarea
          placeholder={placeholder}
          ref={ref}
          id={name}
          name={name}
          rows={row}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange} // Now specific to HTMLTextAreaElement
          className={`w-full pl-2 py-2 outline outline-2 outline-custom-less-gray text-base rounded ${classProp} ${
            error ? "outline-custom-red" : ""
          } ${error ? "focus:ring-custom-red" : "focus:ring-custom-less-gray"}`}
        />
        {helperText && (
          <p
            className={`ml-2 mt-[2px] bg-custom-white text-xs w-auto whitespace-nowrap ${
              error ? "text-custom-red" : "text-grey"
            } ${errorClassProp}`}
          >
            {helperText.replace(/_/g, " ")}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea"; // Optional: Set display name for better debugging
