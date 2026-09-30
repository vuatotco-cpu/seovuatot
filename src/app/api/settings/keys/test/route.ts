import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TEST_PROMPT = 'Trả lời đúng 1 từ: "OK"'

// POST { provider, key }  →  { ok, model, latency, error }
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { provider, key } = await req.json()
  if (!provider || !key) {
    return NextResponse.json({ ok: false, error: 'Thiếu provider hoặc key' }, { status: 400 })
  }

  const start = Date.now()

  try {
    let result: string | null = null
    let model = ''

    switch (provider) {
      case 'anthropic': {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const client = new Anthropic({ apiKey: key })
        const res = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: TEST_PROMPT }],
        })
        result = res.content[0].type === 'text' ? res.content[0].text : null
        model = 'claude-haiku-4-5'
        break
      }

      case 'gemini': {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(key)
        const gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const res = await gemini.generateContent(TEST_PROMPT)
        result = res.response.text()
        model = 'gemini-1.5-flash'
        break
      }

      case 'groq': {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' })
        const GROQ_MODELS = [
          'openai/gpt-oss-120b',
          'openai/gpt-oss-20b',
          'qwen/qwen3.8-27b',
          'allam-2-7b',
        ]
        let lastErr = ''
        for (const m of GROQ_MODELS) {
          try {
            const res = await client.chat.completions.create({
              model: m, messages: [{ role: 'user', content: TEST_PROMPT }], max_tokens: 50,
            })
            result = res.choices[0]?.message?.content || null
            model = m
            break
          } catch (e: any) {
            lastErr = e.message
            if (e?.status === 404 || e?.status === 400) continue
            throw e
          }
        }
        if (!result) throw new Error(lastErr || 'Không có model Groq nào hoạt động')
        break
      }

      case 'openai': {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: key })
        const res = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: TEST_PROMPT }],
          max_tokens: 10,
        })
        result = res.choices[0]?.message?.content || null
        model = 'gpt-4o-mini'
        break
      }

      case 'deepseek': {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' })
        const res = await client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: TEST_PROMPT }],
          max_tokens: 10,
        })
        result = res.choices[0]?.message?.content || null
        model = 'deepseek-chat'
        break
      }

      case 'stability': {
        const res = await fetch('https://api.stability.ai/v1/user/account', {
          headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        result = data.email || 'OK'
        model = 'Stability AI account'
        break
      }

      case 'unsplash': {
        const res = await fetch('https://api.unsplash.com/me', {
          headers: { Authorization: `Client-ID ${key}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        result = 'OK'
        model = 'Unsplash API'
        break
      }

      default:
        return NextResponse.json({ ok: false, error: `Provider không hỗ trợ: ${provider}` }, { status: 400 })
    }

    if (!result) throw new Error('Không nhận được phản hồi')

    return NextResponse.json({
      ok: true,
      model,
      latency: Date.now() - start,
      preview: result.slice(0, 50),
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || 'Lỗi không xác định',
      latency: Date.now() - start,
    })
  }
}
