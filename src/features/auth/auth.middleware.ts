import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config/app.config.js";
import { AppError } from "@/shared/utils/app-error.js";
import type { JwtPayload } from "./auth.types.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    } catch (error) {
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
) => {
  if (!req.user?.is_verified) {
    return next(new AppError("Email not verified", 403));
  }
  next();
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};
