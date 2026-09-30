-- ============================================================
-- PHASE 1 FOUNDATION MIGRATION
-- Chạy trong Supabase SQL Editor (sau supabase-schema.sql)
-- ============================================================

-- ── 0. Tạo profiles nếu chưa tồn tại ───────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name       TEXT,
  avatar_url      TEXT,
  plan            TEXT        DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id)';
  END IF;
END $$;

-- ── 1. Bổ sung columns cho profiles ─────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits     BIGINT  DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS points      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_id     TEXT    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS credits_used BIGINT DEFAULT 0;

-- ── 2. Settings EAV table ────────────────────────────────────
-- key = dot-notation: "general.language", "image.style", etc.
CREATE TABLE IF NOT EXISTS settings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  site_id    UUID,
  key        TEXT        NOT NULL,
  value      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_settings_user_site_key
  ON settings(user_id, COALESCE(site_id::TEXT, ''), key);

CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_key ON settings(user_id, key);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

-- ── 3. GSC connections table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS gsc_connections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  website_id     UUID        REFERENCES websites ON DELETE CASCADE,
  access_token   TEXT,
  refresh_token  TEXT,
  property_url   TEXT,
  scope          TEXT,
  token_expiry   TIMESTAMPTZ,
  connected_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gsc_connections_user ON gsc_connections(user_id);

ALTER TABLE gsc_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_gsc" ON gsc_connections
  FOR ALL USING (auth.uid() = user_id);

-- ── 4. GSC daily data ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gsc_data (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gsc_connection_id UUID        NOT NULL REFERENCES gsc_connections ON DELETE CASCADE,
  date              DATE        NOT NULL,
  impressions       INTEGER     DEFAULT 0,
  clicks            INTEGER     DEFAULT 0,
  ctr               DECIMAL(5,4) DEFAULT 0,
  avg_position      DECIMAL(6,2) DEFAULT 0,
  keyword           TEXT,
  page_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gsc_data_conn_date_kw_url
  ON gsc_data(gsc_connection_id, date, COALESCE(keyword,''), COALESCE(page_url,''));

CREATE INDEX IF NOT EXISTS idx_gsc_data_conn ON gsc_data(gsc_connection_id);
CREATE INDEX IF NOT EXISTS idx_gsc_data_date ON gsc_data(date);

ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_gsc_data" ON gsc_data
  FOR ALL USING (
    gsc_connection_id IN (
      SELECT id FROM gsc_connections WHERE user_id = auth.uid()
    )
  );

-- ── 5. Billing plans table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_plans (
  id                  TEXT        PRIMARY KEY,
  name                TEXT        NOT NULL,
  price_monthly_usd   DECIMAL(10,2) DEFAULT 0,
  price_yearly_usd    DECIMAL(10,2) DEFAULT 0,
  credits_monthly     BIGINT      DEFAULT 0,
  max_sites           INTEGER,
  sort_order          INTEGER     DEFAULT 0,
  is_active           BOOLEAN     DEFAULT TRUE,
  features            JSONB
);

-- Seed billing plans (Wriai pricing)
INSERT INTO billing_plans (id, name, price_monthly_usd, price_yearly_usd, credits_monthly, max_sites, sort_order) VALUES
  ('free',    'Free',         0,     0,     50000,   1,  0),
  ('lite',    'Lite',         1.99,  1.19,  99000,   1,  1),
  ('starter', 'Starter',      8.99,  5.39,  899000,  5,  2),
  ('growth',  'Growth',       19.99, 11.99, 2499000, 20, 3),
  ('scale',   'Scale',        29.99, 17.99, 4499000, 50, 4),
  ('agency',  'Pro Agency',   49.99, 29.99, 7999000, NULL, 5)
ON CONFLICT (id) DO UPDATE SET
  price_monthly_usd = EXCLUDED.price_monthly_usd,
  price_yearly_usd  = EXCLUDED.price_yearly_usd,
  credits_monthly   = EXCLUDED.credits_monthly,
  max_sites         = EXCLUDED.max_sites;

-- ── 6. Subscriptions table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plan_id         TEXT        NOT NULL REFERENCES billing_plans(id),
  billing_cycle   TEXT        DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status          TEXT        DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_sub_id   TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ── 7. Transactions table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type           TEXT        NOT NULL CHECK (type IN ('subscription', 'credit_refill', 'credit_use', 'refund')),
  amount_usd     DECIMAL(10,2) DEFAULT 0,
  credits_delta  BIGINT      DEFAULT 0,
  description    TEXT,
  stripe_pi_id   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- ── 8. Extend articles table ─────────────────────────────────
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS mode         TEXT,
  ADD COLUMN IF NOT EXISTS seo_score    INTEGER,
  ADD COLUMN IF NOT EXISTS geo_score    INTEGER,
  ADD COLUMN IF NOT EXISTS images       JSONB  DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS credits_used BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS cms_post_id  TEXT,
  ADD COLUMN IF NOT EXISTS language     TEXT   DEFAULT 'vi';

-- ── 9. Extend websites table ─────────────────────────────────
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS cms_type         TEXT  DEFAULT 'wordpress' CHECK (cms_type IN ('wordpress', 'shopify', 'ghost', 'laravel', 'custom')),
  ADD COLUMN IF NOT EXISTS wp_url           TEXT,
  ADD COLUMN IF NOT EXISTS wp_app_password  TEXT,
  ADD COLUMN IF NOT EXISTS wp_username      TEXT,
  ADD COLUMN IF NOT EXISTS entity_keywords  TEXT[],
  ADD COLUMN IF NOT EXISTS eeat_author      JSONB,
  ADD COLUMN IF NOT EXISTS image_style      TEXT  DEFAULT 'photorealistic',
  ADD COLUMN IF NOT EXISTS sitemap_url      TEXT;

-- ── 10. Function: deduct credits ─────────────────────────────
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount BIGINT, p_desc TEXT DEFAULT '')
RETURNS BOOLEAN AS $$
DECLARE
  current_credits BIGINT;
BEGIN
  SELECT credits INTO current_credits FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF current_credits IS NULL OR current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  UPDATE profiles
    SET credits = credits - p_amount,
        credits_used = credits_used + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
  INSERT INTO transactions(user_id, type, credits_delta, description)
    VALUES(p_user_id, 'credit_use', -p_amount, p_desc);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 11. Function: add credits ─────────────────────────────────
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount BIGINT, p_desc TEXT DEFAULT '')
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
    SET credits = credits + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
  INSERT INTO transactions(user_id, type, credits_delta, description)
    VALUES(p_user_id, 'credit_refill', p_amount, p_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 12. Trigger: auto-set plan on first subscription ─────────
CREATE OR REPLACE FUNCTION sync_plan_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET plan_id = NEW.plan_id, updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE sync_plan_from_subscription();

-- Done
SELECT 'Phase 1 migration complete' AS status;
