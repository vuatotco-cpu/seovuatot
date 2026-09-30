// WordPress REST API publisher — replaces Puppeteer-based Laravel publisher
// Uses Application Password authentication (WP 5.6+)

export interface WPPublishConfig {
  wpUrl: string          // e.g. https://yoursite.com
  wpUsername: string     // WP admin username
  wpAppPassword: string  // Application Password (not login password)
  postStatus?: 'draft' | 'publish' | 'private' | 'pending'
  slugRule?: 'no-accent' | 'full-vi'
}

export interface WPPublishPayload {
  title: string
  content: string
  slug?: string
  metaDescription?: string
  featuredImageUrl?: string
  categories?: number[]
  tags?: string[]
  authorId?: number
}

export interface WPPublishResult {
  ok: boolean
  postId?: number
  postUrl?: string
  editUrl?: string
  error?: string
}

function makeBasicAuth(username: string, appPassword: string): string {
  return 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64')
}

function slugify(text: string, rule: string = 'no-accent'): string {
  if (rule === 'no-accent') {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 200)
  }
  return text.toLowerCase().trim().replace(/\s+/g, '-').slice(0, 200)
}

export async function publishToWordPress(
  config: WPPublishConfig,
  payload: WPPublishPayload
): Promise<WPPublishResult> {
  const base = config.wpUrl.replace(/\/$/, '')
  const apiBase = `${base}/wp-json/wp/v2`
  const auth = makeBasicAuth(config.wpUsername, config.wpAppPassword)

  const slug = payload.slug
    ? slugify(payload.slug, config.slugRule)
    : slugify(payload.title, config.slugRule)

  let featuredMediaId: number | undefined

  // Upload featured image if URL provided
  if (payload.featuredImageUrl) {
    try {
      featuredMediaId = await uploadMediaFromUrl(apiBase, auth, payload.featuredImageUrl, payload.title)
    } catch {
      // Non-fatal: continue without featured image
    }
  }

  const body: Record<string, unknown> = {
    title:   payload.title,
    content: payload.content,
    slug,
    status:  config.postStatus ?? 'draft',
  }

  if (payload.categories?.length)  body.categories = payload.categories
  if (payload.tags?.length)         body.tags = await getOrCreateTags(apiBase, auth, payload.tags)
  if (featuredMediaId)              body.featured_media = featuredMediaId
  if (payload.authorId)             body.author = payload.authorId

  // Inject Yoast/RankMath meta description via meta field
  if (payload.metaDescription) {
    body.meta = {
      _yoast_wpseo_metadesc: payload.metaDescription,
      rank_math_description: payload.metaDescription,
    }
  }

  const res = await fetch(`${apiBase}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    return { ok: false, error: err.message ?? `HTTP ${res.status}` }
  }

  const post = await res.json()
  return {
    ok: true,
    postId: post.id,
    postUrl: post.link,
    editUrl: `${base}/wp-admin/post.php?post=${post.id}&action=edit`,
  }
}

async function uploadMediaFromUrl(
  apiBase: string,
  auth: string,
  imageUrl: string,
  altText: string
): Promise<number> {
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error('Cannot fetch image')

  const blob = await imgRes.blob()
  const filename = imageUrl.split('/').pop()?.split('?')[0] ?? 'featured.jpg'

  const formData = new FormData()
  formData.append('file', blob, filename)
  formData.append('alt_text', altText)

  const uploadRes = await fetch(`${apiBase}/media`, {
    method: 'POST',
    headers: { 'Authorization': auth },
    body: formData,
  })

  if (!uploadRes.ok) throw new Error('Media upload failed')
  const media = await uploadRes.json()
  return media.id as number
}

async function getOrCreateTags(
  apiBase: string,
  auth: string,
  tagNames: string[]
): Promise<number[]> {
  const ids: number[] = []
  for (const name of tagNames) {
    try {
      // Search for existing tag
      const searchRes = await fetch(`${apiBase}/tags?search=${encodeURIComponent(name)}&per_page=1`, {
        headers: { 'Authorization': auth },
      })
      const existing = await searchRes.json()
      if (existing.length > 0) {
        ids.push(existing[0].id)
        continue
      }
      // Create new tag
      const createRes = await fetch(`${apiBase}/tags`, {
        method: 'POST',
        headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (createRes.ok) {
        const tag = await createRes.json()
        ids.push(tag.id)
      }
    } catch {
      // Skip failed tag operations
    }
  }
  return ids
}

// Test WordPress connection — verify credentials work
export async function testWordPressConnection(
  config: Pick<WPPublishConfig, 'wpUrl' | 'wpUsername' | 'wpAppPassword'>
): Promise<{ ok: boolean; siteName?: string; wpVersion?: string; error?: string }> {
  try {
    const base = config.wpUrl.replace(/\/$/, '')
    const auth = makeBasicAuth(config.wpUsername, config.wpAppPassword)

    // Check /wp-json root for WP info
    const infoRes = await fetch(`${base}/wp-json`, {
      headers: { 'Authorization': auth },
      signal: AbortSignal.timeout(8000),
    })
    if (!infoRes.ok) {
      return { ok: false, error: `Không kết nối được: HTTP ${infoRes.status}` }
    }
    const info = await infoRes.json()

    // Verify user identity via /wp-json/wp/v2/users/me
    const meRes = await fetch(`${base}/wp-json/wp/v2/users/me`, {
      headers: { 'Authorization': auth },
    })
    if (!meRes.ok) {
      return { ok: false, error: 'Sai username hoặc Application Password' }
    }

    return {
      ok: true,
      siteName: info.name,
      wpVersion: info.generator?.replace('https://wordpress.org/?v=', '') ?? 'unknown',
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi kết nối'
    return { ok: false, error: msg }
  }
}
