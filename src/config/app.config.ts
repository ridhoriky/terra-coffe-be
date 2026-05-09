import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("8000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  ALLOWED_ORIGIN: z.string().default("http://localhost:3000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error("❌ Invalid environment variables:", envVars.error.issues);
  throw new Error("Invalid environment variables");
}

export const config = {
  port: Number.parseInt(envVars.data.PORT, 10),
  nodeEnv: envVars.data.NODE_ENV,
  databaseUrl: envVars.data.DATABASE_URL,
  jwtSecret: envVars.data.JWT_SECRET,
  jwtRefreshSecret: envVars.data.JWT_REFRESH_SECRET,
  allowedOrigin: envVars.data.ALLOWED_ORIGIN,
  frontendUrl: envVars.data.FRONTEND_URL,
  google: {
    clientId: envVars.data.GOOGLE_CLIENT_ID,
    clientSecret: envVars.data.GOOGLE_CLIENT_SECRET,
    redirectUri: envVars.data.GOOGLE_REDIRECT_URI,
  },
  smtp: {
    host: envVars.data.SMTP_HOST,
    port: Number.parseInt(envVars.data.SMTP_PORT || "587", 10),
    user: envVars.data.SMTP_USER,
    pass: envVars.data.SMTP_PASS,
    from: envVars.data.SMTP_FROM,
  },
};
