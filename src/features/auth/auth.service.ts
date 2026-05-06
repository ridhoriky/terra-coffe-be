import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "@/config/app.config.js";
import { AppError } from "@/shared/utils/app-error.js";
import * as authQueries from "./auth.queries.js";
import type { JwtPayload } from "./auth.types.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

const SALT_ROUNDS = 12;

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  return { token, expiresAt };
};

export const register = async (input: RegisterInput) => {
  const existingUser = await authQueries.findUserByEmail(input.email);
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const newUser = await authQueries.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  // TODO: Send verification email
  // const verificationToken = crypto.randomBytes(32).toString('hex');
  // const tokenHash = hashToken(verificationToken);
  // const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  // await authQueries.storeEmailVerificationToken(newUser.id, tokenHash, expiresAt);
  // await emailService.sendVerificationEmail(newUser.email, verificationToken);

  return newUser;
};

export const login = async (input: LoginInput) => {
  const user = await authQueries.findUserByEmail(input.email);
  if (!user || !user.password_hash) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordMatch = await bcrypt.compare(
    input.password,
    user.password_hash,
  );
  if (!isPasswordMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    is_verified: user.is_verified,
  });

  const { token: refreshToken, expiresAt } = generateRefreshToken(user.id);
  const tokenHash = hashToken(refreshToken);

  await authQueries.storeRefreshToken(user.id, tokenHash, expiresAt);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      avatar_url: user.avatar_url,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshTokens = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await authQueries.findRefreshToken(tokenHash);

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (new Date() > storedToken.expires_at) {
    await authQueries.deleteRefreshToken(tokenHash);
    throw new AppError("Refresh token expired", 401);
  }

  const user = await authQueries.findUserById(storedToken.user_id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Rotate refresh token
  await authQueries.deleteRefreshToken(tokenHash);

  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    is_verified: user.is_verified,
  });

  const { token: newRefreshToken, expiresAt } = generateRefreshToken(user.id);
  const newTokenHash = hashToken(newRefreshToken);

  await authQueries.storeRefreshToken(user.id, newTokenHash, expiresAt);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);
  await authQueries.deleteRefreshToken(tokenHash);
};

export const getMe = async (userId: string) => {
  const user = await authQueries.findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};
