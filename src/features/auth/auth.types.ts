export type UserRole = "user" | "admin";

export interface JwtPayload {
  sub: string; // user UUID
  email: string;
  role: UserRole;
  isVerified: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string | undefined;
  authProvider: "email" | "google";
}

export interface UserWithPassword extends AuthUser {
  passwordHash: string;
}

export interface TokenRecord {
  userId: string;
  expiresAt: Date;
}
