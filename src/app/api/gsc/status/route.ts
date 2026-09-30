import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ connected: false, error: 'Unauthorized' })

  // Check if GOOGLE_CLIENT_ID is configured
  const noClientId = !process.env.GOOGLE_CLIENT_ID

  // Check for existing GSC connection
  const { data: conn } = await supabase
    .from('gsc_connections')
    .select('id, property_url, connected_at, token_expiry, access_token')
    .eq('user_id', user.id)
    .order('connected_at', { ascending: false })
    .limit(1)
    .single()

  if (!conn?.access_token) {
    return NextResponse.json({ connected: false, noClientId })
  }

  // Check token expiry
  const isExpired = conn.token_expiry && new Date(conn.token_expiry) < new Date()

  // Fetch recent GSC data from DB
  const { data: gscRows } = await supabase
    .from('gsc_data')
    .select('impressions, clicks, ctr, avg_position, keyword, date')
    .eq('gsc_connection_id', conn.id)
    .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
    .order('clicks', { ascending: false })
    .limit(20)

  const rows = gscRows ?? []
  const totalImp  = rows.reduce((s, r) => s + (r.impressions ?? 0), 0)
  const totalClk  = rows.reduce((s, r) => s + (r.clicks ?? 0), 0)
  const avgCtr    = rows.length ? rows.reduce((s, r) => s + (r.ctr ?? 0), 0) / rows.length : 0
  const avgPos    = rows.length ? rows.reduce((s, r) => s + (r.avg_position ?? 0), 0) / rows.length : 0

  return NextResponse.json({
    connected: !isExpired,
    noClientId,
    propertyUrl: conn.property_url,
    connectedAt: conn.connected_at,
    tokenExpired: isExpired,
    summary: {
      impressions:  totalImp,
      clicks:       totalClk,
      avgCtr:       avgCtr,
      avgPosition:  avgPos,
      rows: rows.map(r => ({
        query:       r.keyword ?? '',
        clicks:      r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr:         (r.ctr ?? 0) * 100,
        position:    r.avg_position ?? 0,
      })),
    },
  })
}
