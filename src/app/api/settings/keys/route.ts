import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ENV_FILE = path.join(process.cwd(), '.env.local')

// map từ field key (UI) sang tên biến môi trường
const KEY_MAP: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  gemini:    'GEMINI_API_KEY',
  groq:      'GROQ_API_KEY',
  openai:    'OPENAI_API_KEY',
  deepseek:  'DEEPSEEK_API_KEY',
  stability: 'STABILITY_API_KEY',
  unsplash:  'UNSPLASH_ACCESS_KEY',
}

function readEnv(): string {
  try { return fs.readFileSync(ENV_FILE, 'utf-8') } catch { return '' }
}

function upsertEnvLine(content: string, name: string, value: string): string {
  const regex = new RegExp(`^${name}=.*$`, 'm')
  return regex.test(content)
    ? content.replace(regex, `${name}=${value}`)
    : content.trimEnd() + `\n${name}=${value}\n`
}

// GET — trả về những key nào đang active (không trả về giá trị thật)
export async function GET() {
  const active: Record<string, boolean> = {}
  for (const [field, envVar] of Object.entries(KEY_MAP)) {
    const val = process.env[envVar]
    active[field] = !!(val && val.trim().length > 10 && !val.includes('...') && !val.includes('gsk_...') && !val.includes('sk-ant-...') && !val.includes('sk-...') && !val.includes('AIza...') && !val.includes('your-'))
  }
  return NextResponse.json({ active })
}

// POST — lưu key vào process.env + .env.local
export async function POST(req: NextRequest) {
  const { keys } = (await req.json()) as { keys: Record<string, string> }

  const PLACEHOLDER_PATTERNS = ['...', 'your-', 'sk-ant-api03']

  let content = readEnv()
  const saved: string[] = []
  const skipped: string[] = []

  for (const [field, raw] of Object.entries(keys)) {
    const value = (raw || '').trim()
    const envVar = KEY_MAP[field]
    if (!envVar || !value) continue

    // Bỏ qua nếu là placeholder
    if (PLACEHOLDER_PATTERNS.some(p => value.includes(p)) || value.length < 8) {
      skipped.push(field)
      continue
    }

    // Cập nhật process.env ngay lập tức — có hiệu lực với request tiếp theo
    process.env[envVar] = value

    // Ghi vào .env.local để lưu qua các lần restart
    content = upsertEnvLine(content, envVar, value)
    saved.push(field)
  }

  if (saved.length > 0) {
    try {
      fs.writeFileSync(ENV_FILE, content, 'utf-8')
    } catch (err: any) {
      return NextResponse.json(
        { error: `Không ghi được .env.local: ${err.message}` },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true, saved, skipped })
}
