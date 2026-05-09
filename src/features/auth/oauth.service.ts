import { OAuth2Client, type Credentials } from "google-auth-library";
import { config } from "@/config/app.config.js";
import * as authQueries from "./auth.queries.js";
import * as authService from "./auth.service.js";
import type { AuthUser } from "./auth.types.js";
import { AppError } from "@/shared/utils/app-error.js";
import { logger } from "@/shared/utils/logger.js";

const client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri,
);

export const getTokensFromCode = async (code: string): Promise<Credentials> => {
  try {
    const { tokens } = await client.getToken(code);
    return tokens;
  } catch (err) {
    logger.error(err, "Failed to exchange code for tokens");
    throw new AppError("Failed to exchange code for tokens", 401);
  }
};

export const verifyGoogleToken = async (
  idToken: string,
): Promise<{
  googleId: string;
  email: string;
  name: string;
  picture?: string | undefined;
}> => {
  try {
    if (!config.google.clientId) {
      throw new Error("Google Client ID is not configured");
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError("Invalid Google token payload", 401);
    }

    return {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error(err, "Failed to verify Google token");
    throw new AppError("Failed to verify Google token", 401);
  }
};

export const upsertGoogleUser = async (googleData: {
  googleId: string;
  email: string;
  name: string;
  picture?: string | undefined;
}): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> => {
  let user = await authQueries.findUserByGoogleId(googleData.googleId);

  if (!user) {
    const existingUser = await authQueries.findUserByEmail(googleData.email);

    if (existingUser) {
      await authQueries.linkGoogleAccount(
        existingUser.id,
        googleData.googleId,
        googleData.picture,
      );

      user = (await authQueries.findUserById(existingUser.id))!;
    }
  }

  if (!user) {
    user = await authQueries.createUser({
      name: googleData.name,
      email: googleData.email,
      authProvider: "google",
      googleId: googleData.googleId,
      avatarUrl: googleData.picture,
    });
    await authQueries.updateUserVerificationStatus(user.id, true);
    user.isVerified = true;
  }

  const accessToken = authService.generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  });

  const { token: refreshToken, expiresAt } = authService.generateRefreshToken(
    user.id,
  );
  const tokenHash = authService.hashToken(refreshToken);

  await authQueries.storeRefreshToken(user.id, tokenHash, expiresAt);

  return {
    user,
    accessToken,
    refreshToken,
  };
};
