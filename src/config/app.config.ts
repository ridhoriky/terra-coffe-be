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
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error("❌ Invalid environment variables:", envVars.error.format());
  throw new Error("Invalid environment variables");
}

export const config = {
  port: Number.parseInt(envVars.data.PORT, 10),
  nodeEnv: envVars.data.NODE_ENV,
  databaseUrl: envVars.data.DATABASE_URL,
  jwtSecret: envVars.data.JWT_SECRET,
  jwtRefreshSecret: envVars.data.JWT_REFRESH_SECRET,
  allowedOrigin: envVars.data.ALLOWED_ORIGIN,
};
