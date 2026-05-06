import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "@/config/app.config.js";
import { AppError } from "@/shared/utils/app-error.js";
import * as authQueries from "./auth.queries.js";
import type { JwtPayload } from "./auth.types.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

import * as emailService from "./email.service.js";

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

  // Email verification
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(verificationToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await authQueries.storeEmailVerificationToken(
    newUser.id,
    tokenHash,
    expiresAt,
  );
  await emailService.sendVerificationEmail(newUser.email, verificationToken);

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

export const verifyEmail = async (token: string) => {
  const tokenHash = hashToken(token);
  const storedToken = await authQueries.findEmailVerificationToken(tokenHash);

  if (!storedToken) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  if (new Date() > storedToken.expires_at) {
    await authQueries.deleteEmailVerificationToken(tokenHash);
    throw new AppError("Verification token expired", 400);
  }

  await authQueries.updateUserVerificationStatus(storedToken.user_id, true);
  await authQueries.deleteEmailVerificationToken(tokenHash);
};

export const forgotPassword = async (email: string) => {
  const user = await authQueries.findUserByEmail(email);

  // Always respond with success to prevent user enumeration
  if (!user || user.auth_provider !== "email") {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await authQueries.storePasswordResetToken(user.id, tokenHash, expiresAt);
  await emailService.sendPasswordResetEmail(user.email, resetToken);
};

export const resetPassword = async (input: {
  token: string;
  password: string;
}) => {
  const tokenHash = hashToken(input.token);
  const storedToken = await authQueries.findPasswordResetToken(tokenHash);

  if (!storedToken) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (new Date() > storedToken.expires_at) {
    await authQueries.deletePasswordResetToken(tokenHash);
    throw new AppError("Reset token expired", 400);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  await authQueries.updatePassword(storedToken.user_id, passwordHash);
  await authQueries.deletePasswordResetToken(tokenHash);
  await authQueries.deleteAllUserRefreshTokens(storedToken.user_id);
};

export const resendVerification = async (userId: string) => {
  const user = await authQueries.findUserById(userId);
  if (!user || user.is_verified) {
    return;
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(verificationToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await authQueries.storeEmailVerificationToken(user.id, tokenHash, expiresAt);
  await emailService.sendVerificationEmail(user.email, verificationToken);
};
