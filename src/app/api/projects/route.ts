import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || url.includes('your-project') || !key || key.includes('your-')) return null
  return createClient(url, key)
}

// GET /api/projects — danh sách tất cả projects
export async function GET() {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ projects: [], db_connected: false })

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data || [], db_connected: true })
}

// POST /api/projects — tạo project mới
export async function POST(req: NextRequest) {
  const { domain, name } = await req.json()
  if (!domain) return NextResponse.json({ error: 'Domain là bắt buộc' }, { status: 400 })

  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({
      project: {
        id: crypto.randomUUID(),
        domain: cleanDomain,
        name: name || cleanDomain,
        analysis_status: 'pending',
        created_at: new Date().toISOString(),
      },
      db_connected: false,
    })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ domain: cleanDomain, name: name || cleanDomain })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data, db_connected: true })
}

// DELETE /api/projects — xóa project
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ success: true, db_connected: false })

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
