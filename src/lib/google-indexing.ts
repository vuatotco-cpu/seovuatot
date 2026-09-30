// Google Indexing API - Ping Google ngay sau khi đăng bài
// Giúp bài được index trong vài giờ thay vì vài ngày

export interface IndexingResult {
  success: boolean
  url: string
  notified: boolean
  message: string
}

export async function pingGoogleIndexing(urls: string[]): Promise<IndexingResult[]> {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!serviceAccountKey || serviceAccountKey.includes('...')) {
    return urls.map(url => ({
      success: false,
      url,
      notified: false,
      message: 'Chưa cấu hình GOOGLE_SERVICE_ACCOUNT_KEY',
    }))
  }

  try {
    // Parse service account JSON
    const serviceAccount = JSON.parse(serviceAccountKey)
    const accessToken = await getGoogleAccessToken(serviceAccount)

    const results: IndexingResult[] = []

    for (const url of urls) {
      try {
        const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            type: 'URL_UPDATED',
          }),
        })

        const data = await res.json()
        results.push({
          success: res.ok,
          url,
          notified: res.ok,
          message: res.ok
            ? `Đã gửi URL tới Google (${new Date().toLocaleTimeString('vi-VN')})`
            : `Lỗi: ${data.error?.message || 'Unknown'}`,
        })
      } catch (err: any) {
        results.push({ success: false, url, notified: false, message: err.message })
      }
    }

    return results
  } catch (err: any) {
    return urls.map(url => ({ success: false, url, notified: false, message: err.message }))
  }
}

// Tạo JWT + exchange lấy access token cho Google API
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  // Tạo JWT thủ công
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const unsigned = `${header}.${body}`

  // Sign với private key
  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.update(unsigned)
  const signature = sign.sign(serviceAccount.private_key, 'base64url')
  const jwt = `${unsigned}.${signature}`

  // Exchange JWT lấy access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error('Không lấy được access token')
  return tokenData.access_token
}
