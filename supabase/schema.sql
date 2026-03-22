-- ============================================================
-- Belysium Platform — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Leads ─────────────────────────────────────────────────────────────────────
CREATE TABLE leads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  company       TEXT,
  division      TEXT NOT NULL CHECK (division IN ('professional','developments','invest','family','life','general')),
  message       TEXT,
  source_page   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Only service role can read leads (no public access)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON leads USING (auth.role() = 'service_role');

-- ── Chat sessions ──────────────────────────────────────────────────────────────
CREATE TABLE chat_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    TEXT UNIQUE NOT NULL,
  division      TEXT NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  lead_captured BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON chat_sessions USING (auth.role() = 'service_role');

-- ── Licenses ───────────────────────────────────────────────────────────────────
CREATE TABLE licenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT NOT NULL,
  tier            TEXT NOT NULL CHECK (tier IN ('starter','professional','enterprise','realestate')),
  tools_allowed   TEXT[] NOT NULL DEFAULT '{}',
  uses_remaining  INTEGER,           -- NULL = unlimited
  expires_at      TIMESTAMPTZ,       -- NULL = lifetime
  license_key     TEXT UNIQUE NOT NULL,
  order_id        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON licenses USING (auth.role() = 'service_role');

-- Indexes for common queries
CREATE INDEX idx_licenses_email ON licenses (LOWER(email));
CREATE INDEX idx_licenses_key   ON licenses (license_key);

-- ── Function: decrement license use (called on each tool report) ───────────────
CREATE OR REPLACE FUNCTION decrement_license_use(key TEXT)
RETURNS VOID AS $$
  UPDATE licenses
  SET uses_remaining = GREATEST(0, uses_remaining - 1)
  WHERE license_key = key
    AND uses_remaining IS NOT NULL
    AND uses_remaining > 0;
$$ LANGUAGE sql;

-- ── Optional: tool_usage audit log ───────────────────────────────────────────
CREATE TABLE tool_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key TEXT NOT NULL REFERENCES licenses(license_key),
  tool_id     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON tool_usage USING (auth.role() = 'service_role');
