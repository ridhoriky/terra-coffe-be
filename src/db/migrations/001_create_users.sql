-- Migration: 001_create_users.sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255),                        -- NULL for OAuth users
  auth_provider   VARCHAR(20) NOT NULL DEFAULT 'email', -- 'email' | 'google'
  google_id       VARCHAR(255) UNIQUE,
  avatar_url      TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  role            VARCHAR(20) NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
