-- ═══════════════════════════════════════════════════════════════════════════
-- Flousy Budget Tracker — Supabase Schema
-- ═══════════════════════════════════════════════════════════════════════════
--
-- HOW TO USE:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor (left sidebar)
-- 3. Click "New query"
-- 4. Paste this entire file
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
--
-- NOTE: Authentication is handled by Supabase Auth.
--       The "users" table stores app-specific profile data.
--       The users.id column references auth.users.id.
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enable UUID extension ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Users (profile data — auth is handled by Supabase Auth) ─────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,  -- matches auth.users.id
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT DEFAULT '',   -- unused with Supabase Auth
  display_name  VARCHAR(255) NOT NULL DEFAULT 'User',
  photo_url     TEXT,
  plan          VARCHAR(20) NOT NULL DEFAULT 'free',
  currency      VARCHAR(10) NOT NULL DEFAULT 'USD',
  locale        VARCHAR(10) NOT NULL DEFAULT 'en-US',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  dark_mode     BOOLEAN NOT NULL DEFAULT false,
  notifications BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Month Budgets ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS month_budgets (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_id        VARCHAR(7) NOT NULL,  -- e.g. "2025-01"
  label           VARCHAR(50) NOT NULL,
  total_budget    REAL NOT NULL DEFAULT 0,
  home_part       REAL NOT NULL DEFAULT 0,
  wallet_part     REAL NOT NULL DEFAULT 0,
  bank_part       REAL NOT NULL DEFAULT 0,
  variable_category_bases      JSONB NOT NULL DEFAULT '{}',
  fixed_category_bases         JSONB NOT NULL DEFAULT '{}',
  active_variable_categories   JSONB NOT NULL DEFAULT '[]',
  active_fixed_categories      JSONB NOT NULL DEFAULT '[]',
  category_colors JSONB NOT NULL DEFAULT '{}',
  category_icons  JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Variable Expenses ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS variable_expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_budget_id INTEGER NOT NULL REFERENCES month_budgets(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  amount          REAL NOT NULL,
  type            VARCHAR(100) NOT NULL,
  date            VARCHAR(10) NOT NULL,
  person          VARCHAR(100),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Fixed Expenses ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_budget_id INTEGER NOT NULL REFERENCES month_budgets(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  amount          REAL NOT NULL,
  type            VARCHAR(100) NOT NULL,
  base            REAL NOT NULL DEFAULT 0,
  date            VARCHAR(10),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Saving Goals ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saving_goals (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  target     REAL NOT NULL,
  current    REAL NOT NULL DEFAULT 0,
  source     VARCHAR(20) NOT NULL DEFAULT 'BANK',
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_email                       ON users(email);
CREATE INDEX IF NOT EXISTS idx_month_budgets_user_id             ON month_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_month_budgets_user_month          ON month_budgets(user_id, month_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_user_id         ON variable_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_variable_expenses_month_budget_id ON variable_expenses(month_budget_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id            ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_month_budget_id    ON fixed_expenses(month_budget_id);
CREATE INDEX IF NOT EXISTS idx_saving_goals_user_id              ON saving_goals(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — Recommended
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_budgets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_goals     ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"   ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Month budgets belong to user
CREATE POLICY "Users can manage own month_budgets" ON month_budgets FOR ALL USING (auth.uid() = user_id);

-- Variable expenses belong to user
CREATE POLICY "Users can manage own variable_expenses" ON variable_expenses FOR ALL USING (auth.uid() = user_id);

-- Fixed expenses belong to user
CREATE POLICY "Users can manage own fixed_expenses" ON fixed_expenses FOR ALL USING (auth.uid() = user_id);

-- Saving goals belong to user
CREATE POLICY "Users can manage own saving_goals" ON saving_goals FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- AUTO-UPDATE TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS month_budgets_updated_at ON month_budgets;
CREATE TRIGGER month_budgets_updated_at
  BEFORE UPDATE ON month_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS saving_goals_updated_at ON saving_goals;
CREATE TRIGGER saving_goals_updated_at
  BEFORE UPDATE ON saving_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL: Auto-create profile on Supabase Auth signup
-- ═══════════════════════════════════════════════════════════════════════════
-- This trigger auto-creates a users row when someone signs up via Supabase Auth.
-- The app also does lazy profile creation in /api/auth/me, so this is optional
-- but provides an extra safety net.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- Done! Your Supabase database is ready for Flousy.
-- ═══════════════════════════════════════════════════════════════════════════
