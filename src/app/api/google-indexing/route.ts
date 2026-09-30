import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ projects: [] }, { status: 401 })

  const { data } = await supabase
    .from('google_index_projects')
    .select('id, project_name, client_email, quota_used_today, quota_reset_at, created_at, website_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ projects: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { project_name, service_account_json, website_id } = body

  let client_email = ''
  let private_key = ''

  try {
    const sa = typeof service_account_json === 'string' ? JSON.parse(service_account_json) : service_account_json
    client_email = sa.client_email
    private_key = sa.private_key
    if (!client_email || !private_key) throw new Error('Invalid service account JSON')
  } catch {
    return NextResponse.json({ error: 'Service account JSON không hợp lệ' }, { status: 400 })
  }

  const { data, error } = await supabase.from('google_index_projects').insert({
    user_id: user.id,
    website_id: website_id || null,
    project_name: project_name || client_email.split('@')[0],
    client_email,
    private_key,
    quota_used_today: 0,
    quota_reset_at: new Date().toISOString().slice(0, 10),
  }).select('id, project_name, client_email').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('google_index_projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
