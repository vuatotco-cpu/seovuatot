-- ============================================================
-- PHASE 2-6 MIGRATION
-- Chạy trong Supabase SQL Editor (sau phase1 migration)
-- ============================================================

-- ── 1. AI Radar Opportunities ────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_radar_opportunities (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  website_id   UUID        REFERENCES websites ON DELETE SET NULL,
  keyword      TEXT        NOT NULL,
  suggested_title TEXT,
  type         TEXT        CHECK (type IN ('High Intent', 'Content Gap', 'Easy Rank', '2026 Trend')),
  intent       TEXT        CHECK (intent IN ('Transactional', 'Commercial', 'Informational', 'Navigational')),
  kd           INTEGER,
  kd_label     TEXT,
  volume_range TEXT,
  rationale    TEXT,
  status       TEXT        DEFAULT 'new' CHECK (status IN ('new', 'writing', 'done', 'dismissed')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_radar_user ON ai_radar_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_radar_website ON ai_radar_opportunities(website_id);
ALTER TABLE ai_radar_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_radar" ON ai_radar_opportunities
  FOR ALL USING (auth.uid() = user_id);

-- ── 2. Content Plans ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  website_id  UUID        REFERENCES websites ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  start_date  DATE,
  end_date    DATE,
  status      TEXT        DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_plan_items (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID        NOT NULL REFERENCES content_plans ON DELETE CASCADE,
  keyword        TEXT        NOT NULL,
  title          TEXT,
  scheduled_date DATE,
  article_id     UUID        REFERENCES articles ON DELETE SET NULL,
  status         TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'writing', 'review', 'published')),
  priority       INTEGER     DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_user ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_items ON content_plan_items(plan_id);
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_plans" ON content_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_plan_items" ON content_plan_items
  FOR ALL USING (plan_id IN (SELECT id FROM content_plans WHERE user_id = auth.uid()));

-- ── 3. Social Accounts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_accounts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  platform      TEXT        NOT NULL CHECK (platform IN ('facebook','instagram','threads','linkedin','google_business','telegram','discord','tumblr','wordpress_social','bluesky','devto','mastodon')),
  account_name  TEXT,
  access_token  TEXT,
  refresh_token TEXT,
  extra         JSONB,
  connected_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active     BOOLEAN     DEFAULT TRUE,
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_user ON social_accounts(user_id);
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_social" ON social_accounts FOR ALL USING (auth.uid() = user_id);

-- ── 4. Google Indexing Projects ──────────────────────────────
CREATE TABLE IF NOT EXISTS google_index_projects (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  website_id        UUID        REFERENCES websites ON DELETE SET NULL,
  project_name      TEXT        NOT NULL,
  client_email      TEXT        NOT NULL,
  private_key       TEXT        NOT NULL,
  quota_used_today  INTEGER     DEFAULT 0,
  quota_reset_at    DATE        DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS indexing_submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_id   UUID        REFERENCES google_index_projects ON DELETE SET NULL,
  url          TEXT        NOT NULL,
  notification_type TEXT   DEFAULT 'URL_UPDATED',
  status       TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'failed')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  response     JSONB
);

CREATE INDEX IF NOT EXISTS idx_index_proj_user ON google_index_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_indexing_sub_user ON indexing_submissions(user_id);
ALTER TABLE google_index_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexing_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_gip" ON google_index_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_subs" ON indexing_submissions FOR ALL USING (auth.uid() = user_id);

-- ── 5. Content Decay Tracking ────────────────────────────────
CREATE TABLE IF NOT EXISTS content_decay (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  website_id      UUID        REFERENCES websites ON DELETE SET NULL,
  article_id      UUID        REFERENCES articles ON DELETE CASCADE,
  url             TEXT,
  avg_position_before DECIMAL(6,2),
  avg_position_after  DECIMAL(6,2),
  traffic_drop_pct    DECIMAL(5,2),
  impressions_before  INTEGER,
  impressions_after   INTEGER,
  severity        TEXT        DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ai_diagnosis    TEXT,
  ai_fix_draft    TEXT,
  status          TEXT        DEFAULT 'detected' CHECK (status IN ('detected', 'fixing', 'fixed', 'dismissed')),
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decay_user ON content_decay(user_id);
ALTER TABLE content_decay ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_decay" ON content_decay FOR ALL USING (auth.uid() = user_id);

-- ── 6. Webhooks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  events     TEXT[]      DEFAULT '{}',
  secret     TEXT,
  is_active  BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_webhooks" ON webhooks FOR ALL USING (auth.uid() = user_id);

-- ── 7. API Keys ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  key_hash   TEXT        NOT NULL,
  key_prefix TEXT        NOT NULL,
  is_active  BOOLEAN     DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_api_keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

-- Done
SELECT 'Phase 2-6 migration complete' AS status;
