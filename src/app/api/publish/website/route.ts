import { NextRequest, NextResponse } from 'next/server'
import { publishArticle } from '@/lib/publisher'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120 // 2 phút timeout cho Puppeteer

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { article, config } = body

  if (!article || !config) {
    return NextResponse.json({ error: 'Thiếu thông tin bài viết hoặc cấu hình' }, { status: 400 })
  }

  if (!config.adminUrl || !config.username || !config.password) {
    return NextResponse.json({ error: 'Cần điền adminUrl, username và password trong Cài đặt' }, { status: 400 })
  }

  // Tạo meta description bằng AI nếu chưa có
  let metaDescription = article.metaDescription
  if (!metaDescription) {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (apiKey && apiKey !== 'sk-ant-...') {
        const anthropic = new Anthropic({ apiKey })
        const res = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Viết meta description SEO cho bài: "${article.title}" (từ khóa: ${article.keyword}). Tối đa 155 ký tự, tiếng Việt, hấp dẫn, chứa từ khóa. Chỉ trả về meta description, không kèm text khác.`
          }]
        })
        metaDescription = res.content[0].type === 'text' ? res.content[0].text.trim() : ''
      }
    } catch {}
  }

  const result = await publishArticle(
    {
      ...article,
      metaDescription: metaDescription || `${article.title} - Thông tin hữu ích về ${article.keyword}`,
      metaKeywords: article.keyword,
    },
    config
  )

  return NextResponse.json(result)
}

// GET: lấy danh sách categories từ website
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const adminUrl = searchParams.get('adminUrl')
  const username = searchParams.get('username')
  const password = searchParams.get('password')

  if (!adminUrl || !username || !password) {
    return NextResponse.json({ error: 'Thiếu thông tin đăng nhập' }, { status: 400 })
  }

  try {
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    const page = await browser.newPage()
    await page.goto(`${adminUrl}/login`, { waitUntil: 'networkidle2', timeout: 20000 })

    // Đăng nhập
    await page.evaluate((user: string, pass: string) => {
      const emailInput = document.querySelector('input[name="email"], input[type="email"]') as HTMLInputElement
      const passInput = document.querySelector('input[type="password"]') as HTMLInputElement
      if (emailInput) emailInput.value = user
      if (passInput) passInput.value = pass
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement
      if (btn) btn.click()
    }, username, password)

    await page.waitForNavigation({ timeout: 10000 }).catch(() => {})

    // Lấy danh sách categories từ trang tạo bài
    await page.goto(`${adminUrl}/blog/posts/create`, { waitUntil: 'networkidle2', timeout: 20000 })

    const categories = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'))
      for (const sel of selects) {
        const name = sel.name || sel.id || ''
        if (name.includes('categor')) {
          return Array.from(sel.options).map((o: HTMLOptionElement) => ({ value: o.value, label: o.text.trim() }))
        }
      }
      return []
    })

    await browser.close()
    return NextResponse.json({ categories })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, categories: [] })
  }
}
