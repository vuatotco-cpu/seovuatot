import { generateWithAI } from './ai-router'

export interface WebsiteProfile {
  niche: string
  niche_description: string
  language: string
  entity_tags: string[]
  main_topics: string[]
  target_audience: string
  content_style: string
  competitors: string[]
  pillar_suggestions: string[]
}

async function fetchHomepageText(domain: string): Promise<string> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)' },
    })
    if (!res.ok) return ''
    const html = await res.text()
    // Strip tags and get plain text
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)
  } catch {
    return ''
  }
}

export async function analyzeWebsite(domain: string): Promise<WebsiteProfile> {
  const homepageText = await fetchHomepageText(domain)

  const prompt = `Phân tích website: ${domain}
${homepageText ? `\nNỘI DUNG TRANG CHỦ (trích đoạn):\n${homepageText}\n` : '\n(Không lấy được nội dung trang chủ — hãy phân tích dựa trên tên miền)\n'}
Xác định thông tin website và trả về JSON:
{
  "niche": "Tên lĩnh vực ngắn (3-5 từ)",
  "niche_description": "Mô tả lĩnh vực chi tiết 1-2 câu",
  "language": "vi",
  "entity_tags": ["tag1","tag2","tag3","tag4","tag5"],
  "main_topics": ["chủ đề1","chủ đề2","chủ đề3","chủ đề4"],
  "target_audience": "Mô tả đối tượng mục tiêu chính",
  "content_style": "Blog|E-commerce|News|Services|Community|Portfolio",
  "competitors": ["competitor1.vn","competitor2.vn","competitor3.vn"],
  "pillar_suggestions": [
    "Chủ đề pillar 1 (3-5 từ)",
    "Chủ đề pillar 2",
    "Chủ đề pillar 3",
    "Chủ đề pillar 4"
  ]
}
Chỉ trả về JSON, không text khác.`

  const result = await generateWithAI(
    prompt,
    'Bạn là chuyên gia SEO và phân tích website. Phân tích bất kỳ website nào một cách khách quan, không thiên vị.'
  )

  const jsonMatch = result.content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ')
  return JSON.parse(jsonMatch[0]) as WebsiteProfile
}
