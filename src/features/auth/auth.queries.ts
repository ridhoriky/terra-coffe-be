import pg from "pg";
import { pool } from "@/db/pool.js";
import type { AuthUser, UserWithPassword, TokenRecord } from "./auth.types.js";

type Executor = pg.Pool | pg.PoolClient;

export const findUserByEmail = async (
  email: string,
  executor: Executor = pool,
): Promise<UserWithPassword | undefined> => {
  const result = await executor.query(
    'SELECT id, name, email, password_hash AS "passwordHash", auth_provider AS "authProvider", google_id AS "googleId", avatar_url AS "avatarUrl", is_verified AS "isVerified", role FROM users WHERE email = $1',
    [email],
  );
  return result.rows[0];
};

export const findUserByGoogleId = async (
  googleId: string,
  executor: Executor = pool,
): Promise<AuthUser | undefined> => {
  const result = await executor.query(
    'SELECT id, name, email, auth_provider AS "authProvider", google_id AS "googleId", avatar_url AS "avatarUrl", is_verified AS "isVerified", role FROM users WHERE google_id = $1',
    [googleId],
  );
  return result.rows[0];
};

export const findUserById = async (
  id: string,
  executor: Executor = pool,
): Promise<AuthUser | undefined> => {
  const result = await executor.query(
    'SELECT id, name, email, auth_provider AS "authProvider", google_id AS "googleId", avatar_url AS "avatarUrl", is_verified AS "isVerified", role FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0];
};

export const linkGoogleAccount = async (
  userId: string,
  googleId: string,
  avatarUrl?: string | undefined,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query(
    "UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), is_verified = TRUE, updated_at = NOW() WHERE id = $3",
    [googleId, avatarUrl, userId],
  );
};

export const createUser = async (
  userData: {
    name: string;
    email: string;
    passwordHash?: string | undefined;
    authProvider?: string | undefined;
    googleId?: string | undefined;
    avatarUrl?: string | undefined;
  },
  executor: Executor = pool,
): Promise<AuthUser> => {
  const {
    name,
    email,
    passwordHash,
    authProvider = "email",
    googleId,
    avatarUrl,
  } = userData;

  const result = await executor.query(
    `INSERT INTO users (name, email, password_hash, auth_provider, google_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, is_verified AS "isVerified", auth_provider AS "authProvider", avatar_url AS "avatarUrl"`,
    [name, email, passwordHash, authProvider, googleId, avatarUrl],
  );

  return result.rows[0];
};

export const updateUserVerificationStatus = async (
  userId: string,
  isVerified: boolean,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query("UPDATE users SET is_verified = $1 WHERE id = $2", [
    isVerified,
    userId,
  ]);
};

// Refresh Token Queries
export const storeRefreshToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
};

export const findRefreshToken = async (
  tokenHash: string,
  executor: Executor = pool,
): Promise<TokenRecord | undefined> => {
  const result = await executor.query(
    'SELECT user_id AS "userId", expires_at AS "expiresAt" FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash],
  );
  return result.rows[0];
};

export const deleteRefreshToken = async (
  tokenHash: string,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
    tokenHash,
  ]);
};

export const deleteAllUserRefreshTokens = async (
  userId: string,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
    userId,
  ]);
};

// Email Verification Token Queries
export const storeEmailVerificationToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query(
    "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
};

export const findEmailVerificationToken = async (
  tokenHash: string,
  executor: Executor = pool,
): Promise<TokenRecord | undefined> => {
  const result = await executor.query(
    'SELECT user_id AS "userId", expires_at AS "expiresAt" FROM email_verification_tokens WHERE token_hash = $1',
    [tokenHash],
  );
  return result.rows[0];
};

export const deleteEmailVerificationToken = async (
  tokenHash: string,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query(
    "DELETE FROM email_verification_tokens WHERE token_hash = $1",
    [tokenHash],
  );
};

// Password Reset Token Queries
export const storePasswordResetToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt],
  );
};

export const findPasswordResetToken = async (
  tokenHash: string,
  executor: Executor = pool,
): Promise<TokenRecord | undefined> => {
  const result = await executor.query(
    'SELECT user_id AS "userId", expires_at AS "expiresAt" FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash],
  );
  return result.rows[0];
};

export const deletePasswordResetToken = async (
  tokenHash: string,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query(
    "DELETE FROM password_reset_tokens WHERE token_hash = $1",
    [tokenHash],
  );
};

export const updatePassword = async (
  userId: string,
  passwordHash: string,
  executor: Executor = pool,
): Promise<void> => {
  await executor.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    userId,
  ]);
};
