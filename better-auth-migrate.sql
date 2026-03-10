-- Better Auth schema for PostgreSQL
-- Generated for better-auth with admin() plugin
-- Apply with: docker compose exec postgres psql -U receipts -d receipts -f /docker-entrypoint-initdb.d/better-auth.sql

CREATE TABLE IF NOT EXISTS "user" (
    "id"            TEXT PRIMARY KEY,
    "name"          TEXT NOT NULL,
    "email"         TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "image"         TEXT,
    "role"          TEXT NOT NULL DEFAULT 'user',
    "banned"        BOOLEAN,
    "banReason"     TEXT,
    "banExpires"    TIMESTAMPTZ,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
    "id"                    TEXT PRIMARY KEY,
    "expiresAt"             TIMESTAMPTZ NOT NULL,
    "token"                 TEXT NOT NULL UNIQUE,
    "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
    "ipAddress"             TEXT,
    "userAgent"             TEXT,
    "userId"                TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "impersonatedBy"        TEXT
);

CREATE TABLE IF NOT EXISTS "account" (
    "id"                    TEXT PRIMARY KEY,
    "accountId"             TEXT NOT NULL,
    "providerId"            TEXT NOT NULL,
    "userId"                TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken"           TEXT,
    "refreshToken"          TEXT,
    "idToken"               TEXT,
    "accessTokenExpiresAt"  TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    "scope"                 TEXT,
    "password"              TEXT,
    "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id"          TEXT PRIMARY KEY,
    "identifier"  TEXT NOT NULL,
    "value"       TEXT NOT NULL,
    "expiresAt"   TIMESTAMPTZ NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
