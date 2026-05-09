import rateLimit from "express-rate-limit";
import { AppError } from "../utils/app-error.js";

/**
 * General rate limiter to prevent basic DOS attacks
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res, next): void => {
    next(new AppError("Too many requests, please try again later.", 429));
  },
});

/**
 * Stricter rate limiter for sensitive authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Limit each IP to 10 requests per hour (increased slightly for usability)
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res, next): void => {
    next(
      new AppError(
        "Too many login attempts. Please try again after an hour.",
        429,
      ),
    );
  },
});

/**
 * Limiter for account creation to prevent spam
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // Limit each IP to 5 registrations per hour
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res, next): void => {
    next(
      new AppError(
        "Too many accounts created from this IP. Please try again later.",
        429,
      ),
    );
  },
});
