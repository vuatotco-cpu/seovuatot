import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — load saved opportunities
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ opportunities: [] }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('website_id')

  let query = supabase
    .from('ai_radar_opportunities')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'dismissed')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (websiteId) query = query.eq('website_id', websiteId)

  const { data, error } = await query
  if (error) return NextResponse.json({ opportunities: [] })
  return NextResponse.json({ opportunities: data ?? [] })
}

// POST — save new opportunities from scan
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { opportunities, website_id } = await req.json()
  if (!Array.isArray(opportunities)) return NextResponse.json({ error: 'opportunities must be array' }, { status: 400 })

  // Delete old ones for this website first
  if (website_id) {
    await supabase.from('ai_radar_opportunities')
      .delete()
      .eq('user_id', user.id)
      .eq('website_id', website_id)
  }

  const rows = opportunities.map((o: Record<string, unknown>) => ({
    user_id: user.id,
    website_id: website_id ?? null,
    keyword: o.keyword as string,
    suggested_title: o.suggestedTitle as string,
    type: o.type as string,
    intent: o.intent as string,
    kd: o.kd as number,
    kd_label: (o.kdLabel ?? o.kd_label) as string,
    volume_range: (o.volume ?? o.volume_range) as string,
    rationale: o.rationale as string,
    status: 'new',
  }))

  const { error } = await supabase.from('ai_radar_opportunities').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: rows.length })
}

// PATCH — update status (writing, done, dismissed)
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  const { error } = await supabase.from('ai_radar_opportunities').update({ status }).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
