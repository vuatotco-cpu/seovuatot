import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('website_id')

  let query = supabase
    .from('content_decay')
    .select(`*, articles(title, target_keyword)`)
    .eq('user_id', user.id)
    .order('detected_at', { ascending: false })
    .limit(50)

  if (websiteId) query = query.eq('website_id', websiteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ items: [] })
  return NextResponse.json({ items: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  const { error } = await supabase.from('content_decay')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
