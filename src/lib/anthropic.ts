import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateSEOContent(params: {
  keyword: string
  title: string
  intent: string
  website?: string
  wordCount?: number
}): Promise<string> {
  const { keyword, title, intent, website, wordCount = 1500 } = params

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Viết bài SEO chuẩn E-E-A-T bằng tiếng Việt cho:

Từ khóa chính: "${keyword}"
Tiêu đề bài viết: "${title}"
Search Intent: ${intent}
${website ? `Website: ${website}` : ''}

Yêu cầu:
- Độ dài: khoảng ${wordCount} từ
- Cấu trúc: H1, H2, H3 rõ ràng
- Tối ưu SEO: từ khóa tự nhiên, meta description
- Ngôn ngữ: tiếng Việt chuẩn, chuyên nghiệp
- Format: Markdown

Hãy viết bài hoàn chỉnh, đầy đủ, chất lượng cao.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

export async function generateKeywordIdeas(params: {
  seed: string
  website?: string
  niche?: string
}): Promise<{ keyword: string; intent: string; potential: string }[]> {
  const { seed, website, niche } = params

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Tạo 20 ý tưởng từ khóa SEO liên quan đến "${seed}" bằng tiếng Việt.
${niche ? `Ngách: ${niche}` : ''}
${website ? `Website: ${website}` : ''}

Trả về JSON array với format:
[{"keyword": "...", "intent": "Informational|Commercial|Transactional", "potential": "Cao|Trung bình|Thấp"}]

Chỉ trả về JSON, không kèm text khác.`,
      },
    ],
  })

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
    return JSON.parse(text)
  } catch {
    return []
  }
}

export async function analyzeSEOOpportunity(params: {
  keyword: string
  competitors: string[]
}): Promise<string> {
  const { keyword, competitors } = params

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Phân tích cơ hội SEO cho từ khóa "${keyword}".
Đối thủ hiện tại: ${competitors.join(', ')}

Trả về phân tích ngắn gọn (2-3 câu) về cách tiếp cận tốt nhất để rank top cho từ khóa này, bằng tiếng Việt.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
