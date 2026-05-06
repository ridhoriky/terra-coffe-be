import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config/app.config.js";
import { errorHandler } from "./shared/middleware/error.middleware.js";
import { authRoutes } from "./features/auth/auth.routes.js";

const app = express();

// Global Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigin,
    credentials: true,
  }),
);
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// API Routes
app.use("/api/v1/auth", authRoutes);

// Error Handling Middleware
app.use(errorHandler);

export { app };
