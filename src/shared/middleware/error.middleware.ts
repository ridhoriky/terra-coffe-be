import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { config } from "../../config/app.config.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (
  err: Error | AppError | ZodError,
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

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  // Handle unexpected errors
  if (config.nodeEnv !== "test") {
    logger.error(err, "Unexpected Error");
  }

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
