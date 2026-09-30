import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Step 1: Get websites first to resolve article ownership
  const { data: websitesData } = await supabase
    .from('websites')
    .select('id, domain, name, niche, gsc_connected, cms_type')
    .eq('user_id', user.id)

  const websites = websitesData ?? []
  const websiteIds = websites.map(w => w.id)

  // Step 2: Parallel queries using correct table names and filters
  const [articlesRes, profileRes, gscRes, opportunitiesRes] = await Promise.all([
    websiteIds.length > 0
      ? supabase
          .from('articles')
          .select('id, title, word_count, status, created_at, published_at, target_keyword, website_id')
          .in('website_id', websiteIds)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),

    supabase
      .from('profiles')
      .select('credits, points, plan_id, full_name')
      .eq('id', user.id)
      .single(),

    supabase
      .from('gsc_data')
      .select('impressions, clicks, ctr, avg_position, date')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(30),

    supabase
      .from('ai_radar_opportunities')
      .select('id, keyword, status, kd')
      .eq('user_id', user.id)
      .in('status', ['new', 'writing'])
      .limit(100),
  ])

  const articles = articlesRes.data ?? []
  const profile = profileRes.data
  const gscData = gscRes.data ?? []
  const opportunities = opportunitiesRes.data ?? []

  // Aggregate stats
  const totalArticles = articles.length
  const publishedArticles = articles.filter(a => a.status === 'published').length
  const totalWords = articles.reduce((sum, a) => sum + (a.word_count ?? 0), 0)

  const gsc30d = {
    impressions: gscData.reduce((s, d) => s + (d.impressions ?? 0), 0),
    clicks: gscData.reduce((s, d) => s + (d.clicks ?? 0), 0),
    avgCtr: gscData.length > 0
      ? gscData.reduce((s, d) => s + (d.ctr ?? 0), 0) / gscData.length
      : 0,
    avgPosition: gscData.length > 0
      ? gscData.reduce((s, d) => s + (d.avg_position ?? 0), 0) / gscData.length
      : 0,
  }

  // Breakthrough opportunities: KD < 30
  const breakthroughCount = opportunities.filter(
    o => (o.kd ?? 100) < 30 && o.status === 'new'
  ).length

  // Recent articles (5 latest)
  const recentArticles = articles.slice(0, 5).map(a => ({
    id: a.id,
    title: a.title,
    keyword: a.target_keyword,
    wordCount: a.word_count ?? 0,
    status: a.status,
    createdAt: a.created_at,
    publishedAt: a.published_at,
  }))

  return NextResponse.json({
    profile: {
      credits: profile?.credits ?? 0,
      points: profile?.points ?? 0,
      planId: profile?.plan_id ?? 'free',
      fullName: profile?.full_name ?? '',
    },
    sites: websites.map(w => ({
      id: w.id,
      domain: w.domain,
      name: w.name,
      niche: w.niche,
      gscConnected: w.gsc_connected,
      cmsType: w.cms_type,
    })),
    metrics: {
      totalArticles,
      publishedArticles,
      totalWords,
      gsc30d,
      breakthroughCount,
      totalSites: websites.length,
    },
    recentArticles,
  })
}
