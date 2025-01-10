import HttpError from "@utils/http-errors";
import { Response, NextFunction, Request } from "express";
import { expressjwt } from "express-jwt";
import { isRegExp } from "lodash";


// Define paths that do not require authorization (excluded routes)
export const excludedPaths: (string | RegExp)[] = [
  "/api",
  "/api/auth",
  "/api/auth/reset-password",
  /^\/api\/user\/auth\/reset-password\/[^/]+$/, //TODO: regrex can be used to add check for mongodb id
];

// Define paths that optionally require authorization (only if token is present)
export const optionalPaths: (string | RegExp)[] = [
  "/api/public",
  "/api/public/home",
  /^\/api\/public\/sections\/[^/]+$/,
  /^\/api\/public\/sections\/[^/]+\/[^/]+$/,
  "/api/auth/send-password-reset-link",
  "/api/auth/send-verification-otp",
];


const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  const JWT_KEY:string = process.env.JWT_KEY || "";
  if (!JWT_KEY) {
    throw new Error("JWT_KEY is not defined in the environment variables.");
  } 
  const checkAuth = expressjwt({
    secret: JWT_KEY,
    algorithms: ["HS256"],
    requestProperty: "userData",
    credentialsRequired: true, 
    getToken: (req) => req.headers["authorization"]?.split(" ")[1],
  }).unless({
    path: excludedPaths,
  });

  checkAuth(req, res, (err: any) => {
    if (err) {
      const isOptionalRoute = optionalPaths.some((path) => {
        if (isRegExp(path)) {
          return path.test(req.path);
        } else if (typeof path === "string") {
          return req.path === path;
        }
        return false;
      });

      // Handle unauthorized errors for non-optional routes
      if (err.name === "UnauthorizedError" && !isOptionalRoute) {
        return next(
          new HttpError("Unauthorized user, please do login / signup!", 401)
        );
      }
    }
    next();
  });
};

export default checkAuth;

export interface JWTRequest extends Request {
  userData: {
    userId: string;
    email:string;
    deactivated_at?: Date;
  };
}

//for the optional path (that may have doubt of getting userid)
export const getUserIdFromRequest = (req: JWTRequest): string | undefined => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  return token && req.userData && (req as JWTRequest).userData.userId
    ? (req as JWTRequest).userData.userId
    : undefined;
};
