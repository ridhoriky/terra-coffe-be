import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post(
  "/resend-verification",
  authenticate,
  authController.resendVerification,
);

router.get("/me", authenticate, authController.getMe);

export { router as authRoutes };
