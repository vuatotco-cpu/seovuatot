// Laravel Publisher - tự động đăng bài lên website PHP Laravel
// Xử lý: CSRF token, session cookie, form submit, upload ảnh

export interface LaravelConfig {
  adminUrl: string          // VD: https://vuatot.vn/admin
  loginUrl?: string
  createPostUrl?: string
  username: string
  password: string
  // Selector tùy chỉnh (nếu website có cấu trúc khác chuẩn)
  selectors?: {
    title?: string
    content?: string
    category?: string
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    imageInput?: string
    submitBtn?: string
  }
}

export interface ArticleData {
  title: string
  content: string
  keyword: string
  intent: string
  metaDescription?: string
  metaKeywords?: string
  imageUrl?: string
  imageAlt?: string
}

export interface PublishResult {
  success: boolean
  message: string
  postUrl?: string
  selectedCategory?: string
  error?: string
}

export async function publishToLaravel(
  article: ArticleData,
  config: LaravelConfig
): Promise<PublishResult> {
  let puppeteer: any
  let browser: any

  try {
    puppeteer = await import('puppeteer')

    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1366, height: 768 })

    // Intercept để debug nếu cần
    page.on('console', (msg: any) => console.log('[Browser]', msg.text()))

    // ─── BƯỚC 1: Đăng nhập Laravel ───────────────────────────────────
    const loginUrl = config.loginUrl || `${config.adminUrl}/login`
    console.log(`[Laravel] Đang vào trang đăng nhập: ${loginUrl}`)
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Laravel tự động có CSRF token trong form
    // Puppeteer điền form như người dùng thật nên CSRF tự xử lý
    const emailSels = ['input[name="email"]', 'input[type="email"]', '#email', 'input[name="username"]']
    const passSels = ['input[name="password"]', 'input[type="password"]', '#password']

    for (const sel of emailSels) {
      try {
        const el = await page.$(sel)
        if (el) { await el.click({ clickCount: 3 }); await el.type(config.username, { delay: 40 }); break }
      } catch {}
    }

    for (const sel of passSels) {
      try {
        const el = await page.$(sel)
        if (el) { await el.click({ clickCount: 3 }); await el.type(config.password, { delay: 40 }); break }
      } catch {}
    }

    // Nhấn Login
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement
      if (btn) btn.click()
    })

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})

    const afterLoginUrl = page.url()
    console.log(`[Laravel] Sau đăng nhập: ${afterLoginUrl}`)

    if (afterLoginUrl.includes('login')) {
      await browser.close()
      return { success: false, message: 'Đăng nhập thất bại — kiểm tra email/mật khẩu', error: 'Login failed' }
    }

    // ─── BƯỚC 2: Tải ảnh lên (nếu có) ───────────────────────────────
    let uploadedImagePath: string | null = null
    if (article.imageUrl && !article.imageUrl.startsWith('data:')) {
      uploadedImagePath = await uploadImageToLaravel(page, article.imageUrl, config.adminUrl)
    }

    // ─── BƯỚC 3: Vào trang tạo bài viết ─────────────────────────────
    const createUrl = config.createPostUrl || `${config.adminUrl}/blog/posts/create`
    console.log(`[Laravel] Vào trang tạo bài: ${createUrl}`)
    await page.goto(createUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // ─── BƯỚC 4: Điền tiêu đề ────────────────────────────────────────
    const titleSels = config.selectors?.title
      ? [config.selectors.title]
      : ['input[name="title"]', 'input[name="name"]', '#title', '#post_title', 'input[placeholder*="iêu đề"]', 'input[placeholder*="ame"]']

    for (const sel of titleSels) {
      try {
        const el = await page.$(sel)
        if (el) {
          await el.click({ clickCount: 3 })
          await el.type(article.title, { delay: 30 })
          console.log(`[Laravel] Đã điền title vào: ${sel}`)
          break
        }
      } catch {}
    }

    await page.waitForTimeout(800) // Chờ slug tự tạo

    // ─── BƯỚC 5: Điền nội dung (hỗ trợ nhiều editor) ─────────────────
    await fillContent(page, article.content, config.selectors?.content)

    // ─── BƯỚC 6: Chọn danh mục ───────────────────────────────────────
    const selectedCategory = await selectBestCategory(page, article, config.selectors?.category)
    console.log(`[Laravel] Danh mục đã chọn: ${selectedCategory}`)

    // ─── BƯỚC 7: Upload ảnh thumbnail ────────────────────────────────
    if (article.imageUrl) {
      await uploadThumbnail(page, article.imageUrl, config.selectors?.imageInput)
    }

    // ─── BƯỚC 8: Điền Meta SEO ───────────────────────────────────────
    const metaTitle = config.selectors?.metaTitle || 'input[name="meta_title"], #meta_title, input[name="seo_title"]'
    const metaDesc = config.selectors?.metaDescription || 'textarea[name="meta_description"], #meta_description'
    const metaKw = config.selectors?.metaKeywords || 'input[name="meta_keywords"], #meta_keywords'

    await fillField(page, metaTitle, article.title)
    if (article.metaDescription) await fillField(page, metaDesc, article.metaDescription)
    if (article.metaKeywords) await fillField(page, metaKw, article.metaKeywords)

    // ─── BƯỚC 9: Submit ──────────────────────────────────────────────
    const submitSels = config.selectors?.submitBtn
      ? [config.selectors.submitBtn]
      : ['button[type="submit"]', 'input[type="submit"]', '.btn-save', '#btn-save', '[data-action="save"]']

    for (const sel of submitSels) {
      try {
        const btns = await page.$$(sel)
        if (btns.length > 0) {
          // Click nút cuối (thường là "Lưu" chính)
          await btns[btns.length - 1].click()
          console.log(`[Laravel] Đã click submit: ${sel}`)
          break
        }
      } catch {}
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {})

    const finalUrl = page.url()
    console.log(`[Laravel] Done! URL: ${finalUrl}`)

    await browser.close()

    const isSuccess = !finalUrl.includes('create') && !finalUrl.includes('error')

    return {
      success: isSuccess,
      message: isSuccess
        ? `Đã đăng bài "${article.title}" lên website thành công!`
        : 'Có thể đã đăng nhưng không thể xác nhận. Kiểm tra website.',
      postUrl: finalUrl,
      selectedCategory,
    }

  } catch (error: any) {
    if (browser) await browser.close().catch(() => {})
    console.error('[Laravel] Error:', error)
    return {
      success: false,
      message: 'Lỗi khi tự động đăng bài',
      error: error.message,
    }
  }
}

// Upload ảnh lên Laravel media library (nếu có)
async function uploadImageToLaravel(page: any, imageUrl: string, adminUrl: string): Promise<string | null> {
  try {
    // Tải ảnh về
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return null
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Lưu ảnh tạm để upload
    const { writeFileSync, mkdirSync } = await import('fs')
    const { join } = await import('path')
    const tmpDir = join(process.cwd(), 'tmp')
    mkdirSync(tmpDir, { recursive: true })
    const tmpPath = join(tmpDir, `img_${Date.now()}.jpg`)
    writeFileSync(tmpPath, imgBuffer)

    return tmpPath
  } catch {
    return null
  }
}

// Điền nội dung vào editor (hỗ trợ textarea, TinyMCE, CKEditor, Quill, Trix)
async function fillContent(page: any, content: string, customSel?: string): Promise<void> {
  const sels = customSel ? [customSel] : [
    'textarea[name="content"]',
    'textarea[name="body"]',
    'textarea[name="description"]',
    '#content',
    '#body',
    '.ql-editor',         // Quill
    '[contenteditable="true"]', // Generic rich text
  ]

  // Thử textarea thường
  for (const sel of sels) {
    try {
      const el = await page.$(sel)
      if (!el) continue

      const tagName = await page.evaluate((s: string) => document.querySelector(s)?.tagName?.toLowerCase(), sel)

      if (tagName === 'textarea') {
        await el.click()
        await page.evaluate((s: string, text: string) => {
          const el = document.querySelector(s) as HTMLTextAreaElement
          if (el) { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })) }
        }, sel, content)
        console.log('[Laravel] Content điền vào textarea')
        return
      }

      if (tagName === 'div') {
        // Quill / contenteditable
        await el.click()
        await page.evaluate((s: string, text: string) => {
          const el = document.querySelector(s) as HTMLElement
          if (el) { el.innerHTML = text.replace(/\n/g, '<br>'); el.dispatchEvent(new Event('input', { bubbles: true })) }
        }, sel, content)
        console.log('[Laravel] Content điền vào rich editor')
        return
      }
    } catch {}
  }

  // Thử TinyMCE
  const tinymceFilled = await page.evaluate((text: string) => {
    const tinymce = (window as any).tinymce
    if (!tinymce || !tinymce.editors?.length) return false
    tinymce.editors[0].setContent(text)
    return true
  }, content)
  if (tinymceFilled) { console.log('[Laravel] Content điền vào TinyMCE'); return }

  // Thử CKEditor 4/5
  const ckeditorFilled = await page.evaluate((text: string) => {
    const CKEDITOR = (window as any).CKEDITOR
    if (CKEDITOR) {
      const editors = Object.values(CKEDITOR.instances) as any[]
      if (editors.length > 0) { editors[0].setData(text); return true }
    }
    const ck5 = (window as any).ClassicEditor
    if (ck5) return false // CKEditor 5 cần xử lý khác
    return false
  }, content)
  if (ckeditorFilled) { console.log('[Laravel] Content điền vào CKEditor'); return }

  console.log('[Laravel] Không tìm thấy editor phù hợp')
}

// Upload thumbnail vào input file
async function uploadThumbnail(page: any, imageUrl: string, customSel?: string): Promise<void> {
  if (imageUrl.startsWith('data:')) return // Skip data URL

  try {
    const { writeFileSync, mkdirSync } = await import('fs')
    const { join } = await import('path')

    // Tải ảnh về tmp
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const tmpDir = join(process.cwd(), 'tmp')
    mkdirSync(tmpDir, { recursive: true })
    const tmpPath = join(tmpDir, `thumb_${Date.now()}.jpg`)
    writeFileSync(tmpPath, imgBuffer)

    // Tìm input file cho ảnh
    const imgSels = customSel ? [customSel] : [
      'input[type="file"][name*="image"]',
      'input[type="file"][name*="thumb"]',
      'input[type="file"][name*="photo"]',
      'input[type="file"][name*="cover"]',
      'input[type="file"][name*="avatar"]',
      'input[type="file"]',
    ]

    for (const sel of imgSels) {
      try {
        const el = await page.$(sel)
        if (el) {
          await el.uploadFile(tmpPath)
          console.log(`[Laravel] Đã upload ảnh vào: ${sel}`)
          await page.waitForTimeout(1000)
          break
        }
      } catch {}
    }

    // Xóa file tạm
    const { unlinkSync } = await import('fs')
    try { unlinkSync(tmpPath) } catch {}

  } catch (err) {
    console.error('[Laravel] Upload ảnh lỗi:', err)
  }
}

// Điền field generic
async function fillField(page: any, selectorStr: string, value: string): Promise<void> {
  const sels = selectorStr.split(',').map(s => s.trim())
  for (const sel of sels) {
    try {
      const el = await page.$(sel)
      if (el) {
        await el.click({ clickCount: 3 })
        await el.type(value, { delay: 15 })
        return
      }
    } catch {}
  }
}

// AI chọn danh mục phù hợp nhất
async function selectBestCategory(page: any, article: ArticleData, customSel?: string): Promise<string> {
  const sels = customSel ? [customSel] : [
    'select[name="category_id"]',
    'select[name="category"]',
    'select[name*="categor"]',
    '#category_id',
    '#category',
  ]

  for (const sel of sels) {
    try {
      const categoryData = await page.evaluate((s: string) => {
        const el = document.querySelector(s) as HTMLSelectElement
        if (!el) return null
        return {
          selector: s,
          options: Array.from(el.options)
            .filter(o => o.value && o.value !== '' && o.value !== '0')
            .map(o => ({ value: o.value, text: o.text.trim() })),
        }
      }, sel)

      if (!categoryData?.options?.length) continue

      const keyword = article.keyword.toLowerCase()
      const intent = article.intent

      let best = categoryData.options[0]
      let bestScore = 0

      for (const cat of categoryData.options) {
        const name = cat.text.toLowerCase()
        let score = 0

        // So khớp từ trong keyword với tên category
        keyword.split(' ').filter((w: string) => w.length > 2).forEach((word: string) => {
          if (name.includes(word)) score += 3
        })

        // Theo intent
        if (intent === 'Informational') {
          if (name.match(/hướng dẫn|kinh nghiệm|tips|mẹo|cẩm nang|tin tức|blog/)) score += 4
        } else if (intent === 'Commercial') {
          if (name.match(/review|đánh giá|so sánh|tư vấn/)) score += 4
        } else if (intent === 'Transactional') {
          if (name.match(/mua|bán|giá|khuyến mãi|deal/)) score += 4
        }

        // Category chứa từ quan trọng trong tiêu đề
        article.title.toLowerCase().split(' ').filter((w: string) => w.length > 4).forEach((word: string) => {
          if (name.includes(word)) score += 2
        })

        if (score > bestScore) { bestScore = score; best = cat }
      }

      await page.select(categoryData.selector, best.value)
      return best.text
    } catch {}
  }

  return 'Không chọn được danh mục'
}
