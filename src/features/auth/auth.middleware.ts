import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config/app.config.js";
import { AppError } from "@/shared/utils/app-error.js";
import { logger } from "@/shared/utils/logger.js";
import type { JwtPayload } from "./auth.types.js";

// Augment Express Request type
declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Not authenticated", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Not authenticated", 401);
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = decoded;
      next();
    } catch (err) {
      logger.error(err, "Invalid or expired token");
      throw new AppError("Invalid or expired token", 401);
    }
  } catch (error) {
    next(error);
  }
};

export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.isVerified) {
    return next(new AppError("Email not verified", 403));
  }
  next();
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};
