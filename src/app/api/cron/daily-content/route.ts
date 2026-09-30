import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI, generateImageWithAI, getAIStatus } from '@/lib/ai-router'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'dev-secret'
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = getAIStatus()
  const hasAnyAI = Object.values(status).some(s => s.active)

  if (!hasAnyAI) {
    return NextResponse.json({
      message: 'Demo mode — cần ít nhất 1 API key (Claude/Gemini/GPT-4o/DeepSeek) để chạy thật',
      articles_generated: 0,
      ai_status: status,
    })
  }

  const today = new Date().toLocaleDateString('vi-VN')

  try {
    // Bước 1: AI quét từ khóa tiềm năng
    const keywordRes = await generateWithAI(
      `Hôm nay ${today}, tìm 5 chủ đề/từ khóa SEO hot cho website mua bán đồ cũ tại Việt Nam.

Yêu cầu:
- Từ khóa có KD thấp (< 30), search intent rõ ràng
- Phù hợp xu hướng hiện tại

Trả về JSON array (không thêm text):
[{"keyword":"...","title":"Tiêu đề bài gợi ý","intent":"Informational|Commercial|Transactional","reason":"Lý do ngắn gọn"}]`,
      'Bạn là chuyên gia SEO keyword research tiếng Việt. Chỉ trả về JSON.'
    )

    let keywords: Array<{ keyword: string; title: string; intent: string; reason: string }> = []
    try {
      const text = keywordRes.content.trim()
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      keywords = JSON.parse(jsonMatch?.[0] || text)
    } catch {
      return NextResponse.json({ error: 'Không parse được từ khóa', articles_generated: 0 })
    }

    if (!keywords.length) {
      return NextResponse.json({ message: 'Không tìm được từ khóa', articles_generated: 0 })
    }

    // Bước 2: Viết bài cho 3 từ khóa đầu
    const toWrite = keywords.slice(0, 3)
    const generatedArticles = []

    for (const kw of toWrite) {
      const articleRes = await generateWithAI(
        `Viết bài SEO chuẩn E-E-A-T bằng tiếng Việt:

Từ khóa: "${kw.keyword}"
Tiêu đề: "${kw.title}"
Intent: ${kw.intent}
Website: Nền tảng mua bán đồ cũ C2C tại Việt Nam

Yêu cầu:
- ~1500 từ, format Markdown
- H1, H2, H3 rõ ràng
- Tự nhiên, không nhồi từ khóa
- Cuối bài: 3 câu FAQ + CTA về Vua Tốt

Viết ngay, không giải thích.`,
        'Bạn là chuyên gia viết nội dung SEO tiếng Việt chuẩn E-E-A-T.'
      )

      const content = articleRes.content
      const wordCount = content.split(/\s+/).filter(Boolean).length

      // Tạo ảnh thumbnail (fallback tự động)
      const image = await generateImageWithAI(kw.keyword, kw.title)

      generatedArticles.push({
        keyword: kw.keyword,
        title: kw.title,
        content,
        intent: kw.intent,
        reason: kw.reason,
        word_count: wordCount,
        ai_model: articleRes.model,
        ai_provider: articleRes.provider,
        image_url: image.url,
        image_source: image.source,
        image_alt: image.alt,
        image_credit: image.credit,
        status: 'pending_review',
        generated_at: new Date().toISOString(),
      })
    }

    // Bước 3: Lưu vào Supabase nếu đã cấu hình
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: websites } = await supabase.from('websites').select('id').limit(10)
      if (websites?.length) {
        for (const article of generatedArticles) {
          for (const website of websites) {
            await supabase.from('articles').insert({
              website_id: website.id,
              title: article.title,
              content: article.content,
              target_keyword: article.keyword,
              status: 'pending_review',
              word_count: article.word_count,
              meta_description: `${article.title} - ${article.keyword} tại Việt Nam`,
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      keywords_found: keywords.length,
      articles_generated: generatedArticles.length,
      ai_used: generatedArticles[0]
        ? { provider: generatedArticles[0].ai_provider, model: generatedArticles[0].ai_model }
        : null,
      image_source: generatedArticles[0]?.image_source,
      ai_status: status,
      articles: generatedArticles.map(a => ({
        keyword: a.keyword,
        title: a.title,
        word_count: a.word_count,
        ai_provider: a.ai_provider,
        image_source: a.image_source,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi khi chạy cron job' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const modifiedReq = new NextRequest(req.url, {
    headers: new Headers({
      ...Object.fromEntries(req.headers),
      'authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
    }),
  })
  return GET(modifiedReq)
}
