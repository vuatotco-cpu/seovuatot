import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai-router'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { website, niche } = await req.json()

  const prompt = `Phân tích website "${website}" (${niche || 'sàn thương mại điện tử đồ cũ Việt Nam'}) và tìm 15-20 cơ hội từ khóa SEO tiềm năng nhất cho năm 2026.

Trả về JSON array theo định dạng:
[
  {
    "keyword": "từ khóa cụ thể",
    "suggestedTitle": "Tiêu đề bài viết gợi ý (55-65 ký tự)",
    "type": "High Intent|Content Gap|Easy Rank|2026 Trend",
    "intent": "Transactional|Commercial|Informational|Navigational",
    "kd": số từ 5-35,
    "kdLabel": "Rất dễ|Dễ|Trung bình",
    "volume": "X-Y lượt/tháng",
    "rationale": "Lý do ngắn tại sao từ khóa này có giá trị (1-2 câu)"
  }
]

Ưu tiên từ khóa:
- KD thấp (< 30), volume > 100
- Intent chuyển đổi (Transactional/Commercial)
- Long-tail liên quan đến mua bán đồ cũ, kiểm tra hàng, thủ tục pháp lý
- Xu hướng 2026 (bền vững, tiết kiệm, circular economy)

Chỉ trả về JSON array, không có text khác.`

  try {
    const result = await generateWithAI(prompt, 'Bạn là chuyên gia SEO phân tích cơ hội từ khóa Việt Nam.')
    const raw = result.content

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ')

    const opportunities = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, opportunities, ai_provider: result.provider, ai_model: result.model })
  } catch (err: any) {
    console.error('[AI Radar Scan]', err)
    return NextResponse.json(
      { success: false, error: err.message || 'AI scan thất bại' },
      { status: 500 }
    )
  }
}
