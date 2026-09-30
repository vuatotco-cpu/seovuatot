import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { urls, project_id, notification_type = 'URL_UPDATED' } = await req.json()
  if (!urls?.length || !project_id) {
    return NextResponse.json({ error: 'urls and project_id required' }, { status: 400 })
  }

  // Get service account
  const { data: project } = await supabase
    .from('google_index_projects')
    .select('client_email, private_key, quota_used_today, quota_reset_at')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

  // Check quota (200/day per project)
  const today = new Date().toISOString().slice(0, 10)
  const quotaUsed = project.quota_reset_at === today ? (project.quota_used_today ?? 0) : 0
  const remaining = 200 - quotaUsed
  if (remaining <= 0) return NextResponse.json({ error: `Hết quota hôm nay (${quotaUsed}/200)` }, { status: 429 })

  const urlsToSubmit = (urls as string[]).slice(0, remaining)
  const results: { url: string; ok: boolean; error?: string }[] = []

  for (const url of urlsToSubmit) {
    try {
      // Get JWT access token for Google API
      const accessToken = await getGoogleAccessToken(project.client_email, project.private_key)
      const gRes = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ url, type: notification_type }),
      })
      if (gRes.ok) {
        results.push({ url, ok: true })
      } else {
        const err = await gRes.json()
        results.push({ url, ok: false, error: err.error?.message ?? `HTTP ${gRes.status}` })
      }
    } catch (err: unknown) {
      results.push({ url, ok: false, error: err instanceof Error ? err.message : 'Lỗi' })
    }
  }

  const successCount = results.filter(r => r.ok).length

  // Log submissions
  await supabase.from('indexing_submissions').insert(
    urlsToSubmit.map((url, i) => ({
      user_id: user.id,
      project_id,
      url,
      notification_type,
      status: results[i].ok ? 'submitted' : 'failed',
      response: results[i],
    }))
  )

  // Update quota
  await supabase.from('google_index_projects').update({
    quota_used_today: quotaUsed + urlsToSubmit.length,
    quota_reset_at: today,
  }).eq('id', project_id)

  return NextResponse.json({ submitted: successCount, total: urlsToSubmit.length, results })
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const encode = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const signingInput = `${encode(header)}.${encode(payload)}`

  // Sign with RS256
  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.write(signingInput)
  sign.end()
  const signature = sign.sign(privateKey.replace(/\\n/g, '\n'), 'base64url')

  const jwt = `${signingInput}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Token thất bại')
  return tokenData.access_token
}
