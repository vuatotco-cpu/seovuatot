export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'business'
  created_at: string
}

export interface Website {
  id: string
  user_id: string
  domain: string
  name: string
  niche?: string
  description?: string
  gsc_connected: boolean
  created_at: string
}

export interface KeywordOpportunity {
  id: string
  website_id: string
  keyword: string
  suggested_title: string
  search_volume: number
  keyword_difficulty: number
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational'
  opportunity_type: 'trending' | 'gap' | 'top3' | 'conversion'
  ai_analysis: string
  status: 'new' | 'writing' | 'published' | 'skipped'
  created_at: string
}

export interface Article {
  id: string
  website_id: string
  keyword_id?: string
  title: string
  content: string
  meta_description?: string
  slug?: string
  status: 'draft' | 'published' | 'scheduled'
  word_count: number
  published_at?: string
  created_at: string
  updated_at: string
}

export interface GSCData {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  page?: string
}

export interface DashboardStats {
  total_keywords: number
  total_articles: number
  total_opportunities: number
  websites_count: number
  keywords_growth: number
  articles_growth: number
}
