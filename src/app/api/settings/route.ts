import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — fetch all settings for current user
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('user_id', user.id)
    .is('site_id', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Convert array of {key, value} to flat object
  const result: Record<string, unknown> = {}
  for (const row of data ?? []) {
    result[row.key] = row.value
  }
  return NextResponse.json({ settings: result })
}

// PATCH — upsert settings for current user
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Record<string, unknown>
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Convert flat object to array of {user_id, key, value} for upsert
  const rows = Object.entries(body).map(([key, value]) => ({
    user_id: user.id,
    site_id: null as string | null,
    key,
    value,
    updated_at: new Date().toISOString(),
  }))

  if (rows.length === 0) return NextResponse.json({ saved: 0 })

  const { error } = await supabase
    .from('settings')
    .upsert(rows, { onConflict: 'uq_settings_user_site_key', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: rows.length })
}
