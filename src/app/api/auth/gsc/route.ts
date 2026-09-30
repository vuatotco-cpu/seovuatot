// Google Search Console OAuth2 — initiates OAuth flow
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/indexing',
]

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({
      error: 'GOOGLE_CLIENT_ID chưa được cấu hình trong .env.local',
      setup: 'Tạo OAuth2 credentials tại https://console.cloud.google.com/apis/credentials'
    }, { status: 501 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('website_id') ?? ''

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/gsc/callback`

  // Encode state: user_id + website_id for callback
  const state = Buffer.from(JSON.stringify({ userId: user.id, websiteId })).toString('base64url')

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         GSC_SCOPES.join(' '),
    access_type:   'offline',
    prompt:        'consent',
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  return NextResponse.redirect(authUrl)
}
