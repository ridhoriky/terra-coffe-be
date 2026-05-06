export type UserRole = "user" | "admin";

export interface JwtPayload {
  sub: string; // user UUID
  email: string;
  role: UserRole;
  is_verified: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  avatar_url?: string;
  auth_provider: "email" | "google";
}
