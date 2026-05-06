import { pool } from "@/db/pool.js";
import type { AuthUser } from "./auth.types.js";

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    "SELECT id, name, email, password_hash, auth_provider, google_id, avatar_url, is_verified, role FROM users WHERE email = $1",
    [email],
  );
  return result.rows[0];
};

export const findUserById = async (id: string) => {
  const result = await pool.query(
    "SELECT id, name, email, auth_provider, google_id, avatar_url, is_verified, role FROM users WHERE id = $1",
    [id],
  );
  return result.rows[0] as AuthUser | undefined;
};

export const createUser = async (userData: {
  name: string;
  email: string;
  passwordHash?: string;
  authProvider?: string;
  googleId?: string;
  avatarUrl?: string;
}) => {
  const {
    name,
    email,
    passwordHash,
    authProvider = "email",
    googleId,
    avatarUrl,
  } = userData;

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, auth_provider, google_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, is_verified`,
    [name, email, passwordHash, authProvider, googleId, avatarUrl],
  );

  return result.rows[0];
};

export const updateUserVerificationStatus = async (
  userId: string,
  isVerified: boolean,
) => {
  await pool.query("UPDATE users SET is_verified = $1 WHERE id = $2", [
    isVerified,
    userId,
  ]);
};

// Refresh Token Queries
export const storeRefreshToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) => {
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
};

export const findRefreshToken = async (tokenHash: string) => {
  const result = await pool.query(
    "SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = $1",
    [tokenHash],
  );
  return result.rows[0];
};

export const deleteRefreshToken = async (tokenHash: string) => {
  await pool.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
    tokenHash,
  ]);
};

export const deleteAllUserRefreshTokens = async (userId: string) => {
  await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
};

// Email Verification Token Queries
export const storeEmailVerificationToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) => {
  await pool.query(
    "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
};

export const findEmailVerificationToken = async (tokenHash: string) => {
  const result = await pool.query(
    "SELECT user_id, expires_at FROM email_verification_tokens WHERE token_hash = $1",
    [tokenHash],
  );
  return result.rows[0];
};

export const deleteEmailVerificationToken = async (tokenHash: string) => {
  await pool.query(
    "DELETE FROM email_verification_tokens WHERE token_hash = $1",
    [tokenHash],
  );
};

// Password Reset Token Queries
export const storePasswordResetToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) => {
  await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
};

export const findPasswordResetToken = async (tokenHash: string) => {
  const result = await pool.query(
    "SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = $1",
    [tokenHash],
  );
  return result.rows[0];
};

export const deletePasswordResetToken = async (tokenHash: string) => {
  await pool.query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [
    tokenHash,
  ]);
};

export const updatePassword = async (userId: string, passwordHash: string) => {
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    userId,
  ]);
};
