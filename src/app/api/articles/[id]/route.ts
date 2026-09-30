import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('articles')
    .select(`
      id, title, target_keyword, content, meta_description, slug,
      status, word_count, auto_generated, published_at, created_at, updated_at,
      published_url, cms_post_id, mode, seo_score, geo_score, language, credits_used,
      website_id,
      websites!inner(user_id, domain, name)
    `)
    .eq('id', params.id)
    .eq('websites.user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ article: data })
}
