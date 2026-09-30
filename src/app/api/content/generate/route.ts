import { NextRequest } from 'next/server'
import { generateWithAI, getAIStatus } from '@/lib/ai-router'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { keyword, title, intent, wordCount = 1500 } = await req.json()

  if (!keyword || !title) {
    return new Response(JSON.stringify({ error: 'Thiếu từ khóa hoặc tiêu đề' }), { status: 400 })
  }

  const status = getAIStatus()
  const hasAnyAI = Object.values(status).some(s => s.active)

  if (!hasAnyAI) {
    const demo = `# ${title}\n\n*[Demo mode — cần ít nhất 1 API key để dùng AI thật]*\n\nCác AI được hỗ trợ: Claude, Gemini, GPT-4o, DeepSeek.\nThêm API key vào Cài đặt → API Keys.\n`
    return new Response(demo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const prompt = `Viết bài SEO chuẩn E-E-A-T bằng tiếng Việt:

Từ khóa chính: "${keyword}"
Tiêu đề: "${title}"
Search Intent: ${intent}
Số từ mục tiêu: ~${wordCount} từ

Yêu cầu:
- Cấu trúc H1, H2, H3 rõ ràng (Markdown)
- Từ khóa xuất hiện tự nhiên, không nhồi nhét
- Tiêu chuẩn E-E-A-T, tiếng Việt chuẩn chuyên nghiệp
- FAQ cuối bài (3-5 câu) + CTA phù hợp intent "${intent}"

Viết ngay, không giải thích.`

  // Thử stream với Claude trước (nếu có key)
  const claudeKey = process.env.ANTHROPIC_API_KEY
  if (claudeKey && !claudeKey.includes('...')) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({ apiKey: claudeKey })
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Thêm header model vào đầu stream
            controller.enqueue(encoder.encode(''))
            const messageStream = anthropic.messages.stream({
              model: 'claude-sonnet-4-5',
              max_tokens: 4096,
              system: 'Bạn là chuyên gia viết nội dung SEO tiếng Việt chuẩn E-E-A-T.',
              messages: [{ role: 'user', content: prompt }],
            })
            for await (const chunk of messageStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(chunk.delta.text))
              }
            }
            controller.close()
          } catch {
            controller.error('Claude stream error')
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-AI-Provider': 'claude',
          'Transfer-Encoding': 'chunked',
        },
      })
    } catch {}
  }

  // Fallback: dùng AI Router (không stream, nhưng vẫn trả về nội dung)
  try {
    const result = await generateWithAI(prompt)
    return new Response(result.content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-AI-Provider': result.provider,
        'X-AI-Model': result.model,
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
