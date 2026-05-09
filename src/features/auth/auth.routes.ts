import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import {
  authLimiter,
  registrationLimiter,
} from "../../shared/middleware/rate-limit.middleware.js";

const router = Router();

// Public routes
router.post("/register", registrationLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/google/callback", authController.googleCallback);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post(
  "/resend-verification",
  authenticate,
  authLimiter,
  authController.resendVerification,
);

router.get("/me", authenticate, authController.getMe);

export { router as authRoutes };
