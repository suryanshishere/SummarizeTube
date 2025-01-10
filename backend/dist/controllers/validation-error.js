"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = void 0;
const http_errors_1 = __importDefault(require("../utils/http-errors"));
const express_validator_1 = require("express-validator");
const validationError = (errors) => {
    const errorMessages = errors
        .array()
        .map((error) => error.msg)
        .join(", ");
    return errorMessages !== "Invalid value" ? errorMessages : "Invalid inputs!";
};
exports.default = validationError;
const handleValidationErrors = (req, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return next(new http_errors_1.default(validationError(errors), 400));
    }
};
exports.handleValidationErrors = handleValidationErrors;
