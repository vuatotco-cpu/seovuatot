import { NextRequest, NextResponse } from 'next/server'
import { publishToWordPress, testWordPressConnection } from '@/lib/wordpress-publisher'
import { pingGoogleIndexing } from '@/lib/google-indexing'
import { createClient } from '@/lib/supabase/server'

// GET — test connection
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const wpUrl         = searchParams.get('wpUrl') ?? ''
  const wpUsername    = searchParams.get('wpUsername') ?? ''
  const wpAppPassword = searchParams.get('wpAppPassword') ?? ''

  if (!wpUrl || !wpUsername || !wpAppPassword) {
    return NextResponse.json({ error: 'Thiếu wpUrl, wpUsername hoặc wpAppPassword' }, { status: 400 })
  }

  const result = await testWordPressConnection({ wpUrl, wpUsername, wpAppPassword })
  return NextResponse.json(result)
}

// POST — publish article to WordPress
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    articleId,
    wpUrl,
    wpUsername,
    wpAppPassword,
    postStatus = 'draft',
    slugRule = 'no-accent',
    autoIndex = false,
  } = body

  if (!articleId || !wpUrl || !wpUsername || !wpAppPassword) {
    return NextResponse.json({ error: 'Thiếu articleId, wpUrl, wpUsername hoặc wpAppPassword' }, { status: 400 })
  }

  // Fetch article from DB
  const { data: article, error: artErr } = await supabase
    .from('articles')
    .select('id, title, content, target_keyword, meta_description, slug, website_id')
    .eq('id', articleId)
    .single()

  if (artErr || !article) {
    return NextResponse.json({ error: 'Bài viết không tìm thấy' }, { status: 404 })
  }

  const result = await publishToWordPress(
    { wpUrl, wpUsername, wpAppPassword, postStatus, slugRule },
    {
      title:           article.title,
      content:         article.content ?? '',
      slug:            article.slug ?? article.target_keyword,
      metaDescription: article.meta_description ?? '',
    }
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Update article record
  await supabase
    .from('articles')
    .update({
      status:       postStatus === 'publish' ? 'published' : 'draft',
      published_url: result.postUrl,
      cms_post_id:  String(result.postId),
      published_at: postStatus === 'publish' ? new Date().toISOString() : null,
    })
    .eq('id', articleId)

  // Auto Google Indexing if requested and post is published
  if (autoIndex && postStatus === 'publish' && result.postUrl) {
    try {
      await pingGoogleIndexing([result.postUrl])
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({
    ok: true,
    postId:  result.postId,
    postUrl: result.postUrl,
    editUrl: result.editUrl,
  })
}
