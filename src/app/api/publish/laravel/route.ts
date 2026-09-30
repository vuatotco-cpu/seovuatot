import { NextRequest, NextResponse } from 'next/server'
import { publishToLaravel } from '@/lib/laravel-publisher'
import Anthropic from '@anthropic-ai/sdk'
import { pingGoogleIndexing } from '@/lib/google-indexing'

export const maxDuration = 180 // 3 phút

export async function POST(req: NextRequest) {
  const { article, config } = await req.json()

  if (!article?.title || !config?.adminUrl || !config?.username || !config?.password) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  // Tạo meta description bằng AI nếu chưa có
  let metaDescription = article.metaDescription
  if (!metaDescription) {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (apiKey && !apiKey.includes('...')) {
        const anthropic = new Anthropic({ apiKey })
        const res = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Viết meta description SEO (tối đa 155 ký tự) cho bài: "${article.title}" (từ khóa: ${article.keyword}). Tiếng Việt, hấp dẫn, chứa từ khóa. Chỉ trả về meta description.`
          }]
        })
        metaDescription = res.content[0].type === 'text' ? res.content[0].text.trim().slice(0, 155) : ''
      }
    } catch {}
  }

  const result = await publishToLaravel(
    {
      ...article,
      metaDescription: metaDescription || `${article.title} - Thông tin hữu ích về ${article.keyword} tại Việt Nam`,
      metaKeywords: article.metaKeywords || article.keyword,
    },
    config
  )

  // Ping Google Indexing API ngay sau khi đăng thành công
  let indexingResult = null
  if (result.success && result.postUrl) {
    try {
      const indexing = await pingGoogleIndexing([result.postUrl])
      indexingResult = indexing[0]
    } catch {}
  }

  return NextResponse.json({ ...result, indexing: indexingResult })
}

// Lấy danh sách category từ Laravel
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const adminUrl = searchParams.get('adminUrl')
  const username = searchParams.get('username')
  const password = searchParams.get('password')
  const loginUrl = searchParams.get('loginUrl') || `${adminUrl}/login`
  const createUrl = searchParams.get('createPostUrl') || `${adminUrl}/blog/posts/create`

  if (!adminUrl || !username || !password) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }

  try {
    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const page = await browser.newPage()

    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 20000 })

    await page.evaluate((user: string, pass: string) => {
      const email = document.querySelector('input[name="email"],input[type="email"]') as HTMLInputElement
      const pw = document.querySelector('input[type="password"]') as HTMLInputElement
      if (email) email.value = user
      if (pw) pw.value = pass
      const btn = document.querySelector('button[type="submit"],input[type="submit"]') as HTMLElement
      if (btn) btn.click()
    }, username, password)

    await page.waitForNavigation({ timeout: 12000 }).catch(() => {})

    if (page.url().includes('login')) {
      await browser.close()
      return NextResponse.json({ error: 'Đăng nhập thất bại', categories: [] })
    }

    await page.goto(createUrl, { waitUntil: 'networkidle2', timeout: 20000 })

    // Thu thập categories và cấu trúc form
    const formInfo = await page.evaluate(() => {
      // Tìm select categories
      const selects = Array.from(document.querySelectorAll('select'))
      const categorySelect = selects.find(s =>
        (s.name || s.id || '').toLowerCase().includes('categor')
      )

      const categories = categorySelect
        ? Array.from(categorySelect.options)
            .filter(o => o.value && o.value !== '0' && o.value !== '')
            .map(o => ({ value: o.value, label: o.text.trim() }))
        : []

      // Thu thập tất cả input/textarea/select trong form
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
        .filter(el => (el as HTMLInputElement).name)
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          name: (el as HTMLInputElement).name,
          type: (el as HTMLInputElement).type || 'text',
          id: el.id,
        }))

      return { categories, inputs }
    })

    await browser.close()

    return NextResponse.json({
      success: true,
      categories: formInfo.categories,
      formFields: formInfo.inputs,
      loginOk: true,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, categories: [] })
  }
}
