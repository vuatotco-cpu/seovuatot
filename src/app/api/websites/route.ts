import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list user's websites
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ websites: [] }, { status: 401 })

  const { data, error } = await supabase
    .from('websites')
    .select('id, domain, name, niche, gsc_connected, cms_type, wp_url, wp_username, wp_app_password, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ websites: data ?? [] })
}

// POST — create new website
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domain, name, niche, cms_type, wp_url, wp_username, wp_app_password } = await req.json()
  if (!domain || !name) return NextResponse.json({ error: 'domain và name là bắt buộc' }, { status: 400 })

  const { data, error } = await supabase.from('websites').insert({
    user_id: user.id,
    domain,
    name,
    niche: niche ?? null,
    cms_type: cms_type ?? 'wordpress',
    wp_url: wp_url ?? null,
    wp_username: wp_username ?? null,
    wp_app_password: wp_app_password ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, success: true })
}

// PATCH — update website
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id là bắt buộc' }, { status: 400 })

  const allowed = ['domain', 'name', 'niche', 'cms_type', 'wp_url', 'wp_username', 'wp_app_password', 'gsc_connected', 'entity_keywords', 'eeat_author', 'image_style', 'sitemap_url']
  const filtered: Record<string, unknown> = {}
  for (const k of allowed) if (k in updates) filtered[k] = updates[k]

  const { error } = await supabase.from('websites').update(filtered).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — delete website
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('websites').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
