import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeWebsite } from '@/lib/website-analyzer'

export const maxDuration = 60

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || url.includes('your-project') || !key || key.includes('your-')) return null
  return createClient(url, key)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { domain } = await req.json()
  if (!domain) return NextResponse.json({ error: 'Thiếu domain' }, { status: 400 })

  const supabase = getSupabase()

  if (supabase) {
    await supabase
      .from('projects')
      .update({ analysis_status: 'analyzing' })
      .eq('id', params.id)
  }

  try {
    const profile = await analyzeWebsite(domain)

    if (supabase) {
      const { error } = await supabase
        .from('projects')
        .update({
          niche: profile.niche,
          niche_description: profile.niche_description,
          language: profile.language,
          entity_tags: profile.entity_tags,
          entity_profile: {
            main_topics: profile.main_topics,
            target_audience: profile.target_audience,
            content_style: profile.content_style,
            competitors: profile.competitors,
            pillar_suggestions: profile.pillar_suggestions,
          },
          analysis_status: 'done',
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (error) throw error
    }

    return NextResponse.json({ success: true, profile })
  } catch (err: any) {
    if (supabase) {
      await supabase
        .from('projects')
        .update({ analysis_status: 'error', updated_at: new Date().toISOString() })
        .eq('id', params.id)
    }
    return NextResponse.json(
      { error: err.message || 'Phân tích website thất bại' },
      { status: 500 }
    )
  }
}
