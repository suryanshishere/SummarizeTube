import HttpError from "@utils/http-errors";
import { NextFunction, Request } from "express";
import { validationResult } from "express-validator";

const validationError = (errors: any) => {
  const errorMessages = errors
    .array()
    .map((error: { msg: string }) => error.msg)
    .join(", ");
  return errorMessages !== "Invalid value" ? errorMessages : "Invalid inputs!";
};

export default validationError;

export const handleValidationErrors = (req: Request, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(validationError(errors), 400));
  }
};
