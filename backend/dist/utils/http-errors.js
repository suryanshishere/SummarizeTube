"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpError extends Error {
    constructor(message, errorCode, extraData) {
        super(message);
        this.code = errorCode;
        this.extraData = extraData;
    }
}
exports.default = HttpError;
