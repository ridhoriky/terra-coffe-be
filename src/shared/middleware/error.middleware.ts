import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error.js";
import { config } from "../../config/app.config.js";

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.constructor.name.toUpperCase(),
        message: err.message,
      },
    });
  }

  // Handle unexpected errors
  console.error("Unexpected Error:", err);

  const statusCode = 500;
  const message =
    config.nodeEnv === "production"
      ? "Something went wrong"
      : err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  });
};
