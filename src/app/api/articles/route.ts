import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || url.includes('your-project') || !key || key.includes('your-')) return null
  return createClient(url, key)
}

// GET: lấy danh sách bài viết
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ articles: [], total: 0, db_connected: false })
  }

  let query = supabase
    .from('articles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ articles: data || [], total: count || 0, db_connected: true })
}

// DELETE: xóa bài viết
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'DB chưa kết nối' }, { status: 400 })

  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH: cập nhật trạng thái bài viết
export async function PATCH(req: NextRequest) {
  const { id, status, published_url } = await req.json()
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'DB chưa kết nối' }, { status: 400 })

  const updates: Record<string, any> = { status }
  if (published_url) updates.published_url = published_url
  if (status === 'published') updates.published_at = new Date().toISOString()

  const { error } = await supabase.from('articles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
