"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdFromRequest = exports.optionalPaths = exports.excludedPaths = void 0;
const http_errors_1 = __importDefault(require("../utils/http-errors"));
const express_jwt_1 = require("express-jwt");
const lodash_1 = require("lodash");
// Define paths that do not require authorization (excluded routes)
exports.excludedPaths = [
    "/api",
    "/api/auth",
    "/api/auth/reset-password",
    /^\/api\/user\/auth\/reset-password\/[^/]+$/, //TODO: regrex can be used to add check for mongodb id
];
// Define paths that optionally require authorization (only if token is present)
exports.optionalPaths = [
    "/api/public",
    "/api/public/home",
    /^\/api\/public\/sections\/[^/]+$/,
    /^\/api\/public\/sections\/[^/]+\/[^/]+$/,
    "/api/auth/send-password-reset-link",
    "/api/auth/send-verification-otp",
];
const checkAuth = (req, res, next) => {
    const JWT_KEY = process.env.JWT_KEY || "";
    if (!JWT_KEY) {
        throw new Error("JWT_KEY is not defined in the environment variables.");
    }
    const checkAuth = (0, express_jwt_1.expressjwt)({
        secret: JWT_KEY,
        algorithms: ["HS256"],
        requestProperty: "userData",
        credentialsRequired: true,
        getToken: (req) => { var _a; return (_a = req.headers["authorization"]) === null || _a === void 0 ? void 0 : _a.split(" ")[1]; },
    }).unless({
        path: exports.excludedPaths,
    });
    checkAuth(req, res, (err) => {
        if (err) {
            const isOptionalRoute = exports.optionalPaths.some((path) => {
                if ((0, lodash_1.isRegExp)(path)) {
                    return path.test(req.path);
                }
                else if (typeof path === "string") {
                    return req.path === path;
                }
                return false;
            });
            // Handle unauthorized errors for non-optional routes
            if (err.name === "UnauthorizedError" && !isOptionalRoute) {
                return next(new http_errors_1.default("Unauthorized user, please do login / signup!", 401));
            }
        }
        next();
    });
};
exports.default = checkAuth;
//for the optional path (that may have doubt of getting userid)
const getUserIdFromRequest = (req) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader === null || authHeader === void 0 ? void 0 : authHeader.split(" ")[1];
    return token && req.userData && req.userData.userId
        ? req.userData.userId
        : undefined;
};
exports.getUserIdFromRequest = getUserIdFromRequest;
