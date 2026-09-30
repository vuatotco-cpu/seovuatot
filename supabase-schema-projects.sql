-- ============================================================
-- SEO AI Platform — Schema bổ sung: Multi-Website Projects
-- Chạy file này trong Supabase SQL Editor (sau schema gốc)
-- ============================================================

-- ── PROJECTS (mỗi website là 1 project riêng) ───────────────
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain          TEXT NOT NULL,
  name            TEXT,
  niche           TEXT,
  niche_description TEXT,
  language        TEXT DEFAULT 'vi',
  entity_tags     TEXT[],
  entity_profile  JSONB,   -- AI-detected: entities, keywords, description
  analysis_status TEXT DEFAULT 'pending'
                  CHECK (analysis_status IN ('pending','analyzing','done','error')),
  analyzed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PILLAR TOPICS (bài trụ cột cho mỗi project) ─────────────
CREATE TABLE IF NOT EXISTS pillar_topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  keyword         TEXT NOT NULL,
  volume_estimate TEXT,
  kd_estimate     INTEGER CHECK (kd_estimate BETWEEN 0 AND 100),
  intent          TEXT CHECK (intent IN ('Informational','Commercial','Transactional','Navigational')),
  description     TEXT,
  target_url      TEXT,
  status          TEXT DEFAULT 'planned'
                  CHECK (status IN ('planned','writing','published','skip')),
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CLUSTER ARTICLES (bài vệ tinh, gắn với pillar) ──────────
CREATE TABLE IF NOT EXISTS cluster_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pillar_id       UUID NOT NULL REFERENCES pillar_topics(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  keyword         TEXT NOT NULL,
  volume_estimate TEXT,
  kd_estimate     INTEGER CHECK (kd_estimate BETWEEN 0 AND 100),
  intent          TEXT CHECK (intent IN ('Informational','Commercial','Transactional','Navigational')),
  priority        INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  rationale       TEXT,    -- AI giải thích tại sao nên viết bài này
  target_url      TEXT,
  status          TEXT DEFAULT 'planned'
                  CHECK (status IN ('planned','writing','published','skip')),
  article_id      UUID,    -- liên kết với bảng articles khi đã viết
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTENT GAPS (đối thủ có nhưng mình chưa có) ────────────
CREATE TABLE IF NOT EXISTS content_gaps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword         TEXT NOT NULL,
  suggested_title TEXT,
  opportunity_type TEXT CHECK (opportunity_type IN ('competitor_gap','trending_2026','untapped','easy_rank')),
  volume_estimate TEXT,
  kd_estimate     INTEGER,
  potential       TEXT,    -- 'Cao' | 'Trung bình' | 'Thấp'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEX để query nhanh ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pillar_project ON pillar_topics(project_id);
CREATE INDEX IF NOT EXISTS idx_cluster_project ON cluster_articles(project_id);
CREATE INDEX IF NOT EXISTS idx_cluster_pillar  ON cluster_articles(pillar_id);
CREATE INDEX IF NOT EXISTS idx_gaps_project    ON content_gaps(project_id);

-- ── RLS (mọi người đọc được, không cần auth vì dùng service key) ──
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pillar_topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_gaps     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_projects"
  ON projects FOR ALL USING (true);
CREATE POLICY "service_role_all_pillars"
  ON pillar_topics FOR ALL USING (true);
CREATE POLICY "service_role_all_clusters"
  ON cluster_articles FOR ALL USING (true);
CREATE POLICY "service_role_all_gaps"
  ON content_gaps FOR ALL USING (true);
