import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ accounts: [] }, { status: 401 })

  const { data } = await supabase
    .from('social_accounts')
    .select('id, platform, account_name, is_active, connected_at, extra')
    .eq('user_id', user.id)
    .order('platform')

  return NextResponse.json({ accounts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform, account_name, access_token, extra } = await req.json()
  if (!platform || !access_token) return NextResponse.json({ error: 'platform and access_token required' }, { status: 400 })

  const { error } = await supabase.from('social_accounts').upsert({
    user_id: user.id,
    platform,
    account_name: account_name || null,
    access_token,
    extra: extra || {},
    is_active: true,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform } = await req.json()
  const { error } = await supabase.from('social_accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
