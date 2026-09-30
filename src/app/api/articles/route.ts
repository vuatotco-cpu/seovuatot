import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: lấy danh sách bài viết của user hiện tại
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ articles: [], total: 0 }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Join through websites to get only user's articles (RLS handles this)
  let query = supabase
    .from('articles')
    .select(`
      id, title, target_keyword, content, meta_description, slug,
      status, word_count, auto_generated, published_at, created_at, updated_at,
      published_url, cms_post_id, mode, seo_score, geo_score, language, credits_used,
      website_id,
      websites!inner(user_id, domain, name)
    `, { count: 'exact' })
    .eq('websites.user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ articles: data || [], total: count || 0 })
}

// POST: tạo bài viết mới
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, keyword, content, status = 'pending_review', website_id, mode, word_count, meta_description, slug, seo_score, geo_score, images, credits_used, language } = body

  // Resolve website_id: use provided or pick user's first site
  let siteId = website_id
  if (!siteId) {
    const { data: sites } = await supabase.from('websites').select('id').eq('user_id', user.id).limit(1).single()
    siteId = sites?.id ?? null
  }

  if (!siteId) return NextResponse.json({ error: 'Chưa có website nào. Thêm website trước.' }, { status: 400 })

  const wordCount = word_count ?? (content ? content.split(/\s+/).length : 0)
  const articleSlug = slug ?? (title ?? keyword).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 80)

  const { data, error } = await supabase.from('articles').insert({
    website_id: siteId,
    title: title ?? keyword,
    target_keyword: keyword,
    content,
    meta_description,
    slug: articleSlug,
    status,
    mode,
    word_count: wordCount,
    seo_score,
    geo_score,
    images: images ?? [],
    credits_used: credits_used ?? 0,
    language: language ?? 'vi',
    auto_generated: true,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduct credits if needed
  if (credits_used && credits_used > 0) {
    await supabase.rpc('deduct_credits', { p_user_id: user.id, p_amount: credits_used, p_desc: `Bài viết: ${title ?? keyword}` })
  }

  return NextResponse.json({ id: data.id, success: true })
}

// DELETE: xóa bài viết
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  // RLS policy ensures user can only delete their own articles
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH: cập nhật trạng thái / nội dung bài viết
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, published_url, content, title, meta_description } = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) updates.status = status
  if (published_url !== undefined) updates.published_url = published_url
  if (content !== undefined) updates.content = content
  if (title !== undefined) updates.title = title
  if (meta_description !== undefined) updates.meta_description = meta_description
  if (status === 'published') updates.published_at = new Date().toISOString()

  const { error } = await supabase.from('articles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
