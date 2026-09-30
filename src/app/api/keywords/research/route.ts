import { NextRequest, NextResponse } from 'next/server'
import { getKeywordData, getRelatedKeywords, analyzeIntent } from '@/lib/dataforseo'
import { generateWithAI } from '@/lib/ai-router'

export const maxDuration = 60

// POST: nghiên cứu từ khóa theo seed
export async function POST(req: NextRequest) {
  const { keyword, mode = 'related' } = await req.json()
  if (!keyword) return NextResponse.json({ error: 'Thiếu từ khóa' }, { status: 400 })

  if (mode === 'ai_suggest') {
    // AI gợi ý từ khóa tiềm năng dựa trên niche
    const aiRes = await generateWithAI(
      `Gợi ý 15 từ khóa SEO có tiềm năng cao cho website mua bán đồ cũ Việt Nam (vuatot.vn).
Chủ đề liên quan đến: "${keyword}"

Yêu cầu từ khóa:
- Tiếng Việt tự nhiên
- Độ cạnh tranh thấp (người dùng thực sự tìm kiếm)
- Phù hợp với C2C marketplace đồ cũ
- Có thể là: hướng dẫn, mẹo mua bán, review sản phẩm cũ, so sánh giá

Trả về JSON array:
[{"keyword":"...","estimated_volume":"500-1000","estimated_kd":15,"intent":"Informational|Commercial|Transactional","title":"Tiêu đề bài viết gợi ý"}]

Chỉ JSON, không giải thích.`,
      'Bạn là chuyên gia SEO keyword research cho thị trường Việt Nam.'
    )

    try {
      const text = aiRes.content.trim()
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      const suggestions = JSON.parse(jsonMatch?.[0] || text)
      return NextResponse.json({ keywords: suggestions, source: 'ai', model: aiRes.model })
    } catch {
      return NextResponse.json({ error: 'Không parse được gợi ý AI' }, { status: 500 })
    }
  }

  // Lấy dữ liệu thật từ DataForSEO + related keywords
  const [mainData, relatedData] = await Promise.all([
    getKeywordData([keyword]),
    getRelatedKeywords(keyword),
  ])

  const enriched = [
    ...mainData,
    ...relatedData.slice(0, 15),
  ].map(kw => ({
    ...kw,
    intent: analyzeIntent(kw.keyword),
    difficulty_label: kw.kd <= 15 ? 'Rất dễ' : kw.kd <= 30 ? 'Dễ' : kw.kd <= 50 ? 'Trung bình' : 'Khó',
    opportunity_score: Math.round((kw.volume / 100) * (1 - kw.kd / 100) * 10),
  }))

  return NextResponse.json({
    keywords: enriched.sort((a, b) => b.opportunity_score - a.opportunity_score),
    source: process.env.DATAFORSEO_LOGIN?.includes('your-email') ? 'mock' : 'dataforseo',
  })
}
