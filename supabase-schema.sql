-- ============================================
-- SEO AI Platform - Supabase Schema
-- Chạy file này trong Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (thông tin người dùng)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- WEBSITES (website của người dùng)
-- ============================================
CREATE TABLE IF NOT EXISTS websites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  niche TEXT,
  description TEXT,
  gsc_connected BOOLEAN DEFAULT FALSE,
  gsc_refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- KEYWORD_OPPORTUNITIES (cơ hội từ AI Radar)
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  website_id UUID REFERENCES websites ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  suggested_title TEXT,
  search_volume_min INTEGER,
  search_volume_max INTEGER,
  keyword_difficulty INTEGER,
  intent TEXT DEFAULT 'Informational' CHECK (intent IN ('Informational', 'Commercial', 'Transactional', 'Navigational')),
  opportunity_type TEXT DEFAULT 'gap' CHECK (opportunity_type IN ('trending', 'gap', 'top3', 'conversion')),
  ai_analysis TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'writing', 'published', 'skipped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ARTICLES (bài viết)
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  website_id UUID REFERENCES websites ON DELETE CASCADE NOT NULL,
  keyword_id UUID REFERENCES keyword_opportunities ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  slug TEXT,
  target_keyword TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'pending_review')),
  auto_generated BOOLEAN DEFAULT FALSE,  -- true nếu do cron AI tạo tự động
  word_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- KEYWORDS (từ khóa đang theo dõi)
-- ============================================
CREATE TABLE IF NOT EXISTS tracked_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  website_id UUID REFERENCES websites ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  current_position INTEGER,
  previous_position INTEGER,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  target_url TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_keywords ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Websites policies
CREATE POLICY "Users can CRUD own websites" ON websites FOR ALL USING (auth.uid() = user_id);

-- Keyword opportunities policies
CREATE POLICY "Users can CRUD keyword_opportunities via website" ON keyword_opportunities
  FOR ALL USING (
    website_id IN (SELECT id FROM websites WHERE user_id = auth.uid())
  );

-- Articles policies
CREATE POLICY "Users can CRUD articles via website" ON articles
  FOR ALL USING (
    website_id IN (SELECT id FROM websites WHERE user_id = auth.uid())
  );

-- Tracked keywords policies
CREATE POLICY "Users can CRUD tracked_keywords via website" ON tracked_keywords
  FOR ALL USING (
    website_id IN (SELECT id FROM websites WHERE user_id = auth.uid())
  );

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_opportunities_website ON keyword_opportunities(website_id);
CREATE INDEX IF NOT EXISTS idx_articles_website ON articles(website_id);
CREATE INDEX IF NOT EXISTS idx_tracked_keywords_website ON tracked_keywords(website_id);

-- ============================================
-- Sample data (optional - xóa nếu không cần)
-- ============================================
-- INSERT INTO websites (user_id, domain, name, niche)
-- VALUES (auth.uid(), 'vuatot.vn', 'Vua Tốt', 'Mua bán đồ cũ C2C');
