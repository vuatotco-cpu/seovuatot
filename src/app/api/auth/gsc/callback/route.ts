// Google Search Console OAuth2 callback
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/google-console?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/google-console?error=missing_params`)
  }

  let stateData: { userId: string; websiteId: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/google-console?error=invalid_state`)
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID ?? ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''
  const redirectUri  = `${appUrl}/api/auth/gsc/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('GSC token exchange failed:', err)
    return NextResponse.redirect(`${appUrl}/dashboard/google-console?error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json()

  // Fetch available GSC properties
  let propertyUrl = ''
  try {
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (sitesRes.ok) {
      const sites = await sitesRes.json()
      propertyUrl = sites.siteEntry?.[0]?.siteUrl ?? ''
    }
  } catch {
    // Non-fatal
  }

  // Save to Supabase
  const supabase = createClient()
  const expiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  const { error: dbErr } = await supabase
    .from('gsc_connections')
    .upsert({
      user_id:      stateData.userId,
      website_id:   stateData.websiteId || null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      property_url: propertyUrl,
      scope:        tokens.scope,
      token_expiry: expiry,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id,website_id' })

  if (dbErr) {
    console.error('GSC DB save error:', dbErr)
    return NextResponse.redirect(`${appUrl}/dashboard/google-console?error=db_save_failed`)
  }

  // Mark website as GSC connected
  if (stateData.websiteId) {
    await supabase
      .from('websites')
      .update({ gsc_connected: true })
      .eq('id', stateData.websiteId)
  }

  return NextResponse.redirect(`${appUrl}/dashboard/google-console?connected=true`)
}
