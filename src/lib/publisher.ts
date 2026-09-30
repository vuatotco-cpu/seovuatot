// Publisher - tự động đăng bài lên website qua Puppeteer
// Hoạt động như người dùng thật: mở trình duyệt, đăng nhập, điền form, submit

export interface PublishConfig {
  adminUrl: string        // VD: https://vuatot.vn/admin
  loginUrl?: string       // VD: https://vuatot.vn/admin/login (tự suy nếu không điền)
  createPostUrl?: string  // VD: https://vuatot.vn/admin/blog/posts/create
  username: string
  password: string
}

export interface ArticleToPublish {
  title: string
  content: string
  keyword: string
  intent: string
  metaDescription?: string
  metaKeywords?: string
}

export interface PublishResult {
  success: boolean
  message: string
  postUrl?: string
  selectedCategory?: string
  error?: string
}

// Hàm chính: dùng Puppeteer để tự động đăng bài
export async function publishArticle(
  article: ArticleToPublish,
  config: PublishConfig
): Promise<PublishResult> {
  let puppeteer: any
  let browser: any

  try {
    // Import động để tránh lỗi khi build
    puppeteer = await import('puppeteer')

    browser = await puppeteer.default.launch({
      headless: true, // true = chạy ngầm, false = hiện cửa sổ trình duyệt
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    // BƯỚC 1: Đăng nhập vào admin
    const loginUrl = config.loginUrl || `${config.adminUrl}/login`
    console.log(`[Publisher] Đang đăng nhập vào: ${loginUrl}`)
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Tìm và điền form đăng nhập - thử nhiều selector phổ biến
    const emailSelectors = ['input[name="email"]', 'input[type="email"]', '#email', 'input[name="username"]', '#username']
    const passwordSelectors = ['input[name="password"]', 'input[type="password"]', '#password']
    const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', '.btn-login', '#login-btn']

    for (const sel of emailSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 3000 })
        await page.type(sel, config.username, { delay: 50 })
        break
      } catch {}
    }

    for (const sel of passwordSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 3000 })
        await page.type(sel, config.password, { delay: 50 })
        break
      } catch {}
    }

    for (const sel of submitSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 3000 })
        await page.click(sel)
        break
      } catch {}
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
    console.log(`[Publisher] Đã đăng nhập. URL hiện tại: ${page.url()}`)

    // BƯỚC 2: Điều hướng đến trang tạo bài viết
    const createUrl = config.createPostUrl || `${config.adminUrl}/blog/posts/create`
    console.log(`[Publisher] Đang mở trang tạo bài: ${createUrl}`)
    await page.goto(createUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // BƯỚC 3: Điền tiêu đề bài viết
    const titleSelectors = [
      'input[name="title"]',
      'input[name="name"]',
      '#title',
      '#post-title',
      'input[placeholder*="tiêu đề"]',
      'input[placeholder*="Tiêu đề"]',
    ]
    for (const sel of titleSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 3000 })
        await page.click(sel, { clickCount: 3 })
        await page.type(sel, article.title, { delay: 30 })
        console.log(`[Publisher] Đã điền tiêu đề`)
        break
      } catch {}
    }

    await page.waitForTimeout(1000)

    // BƯỚC 4: Điền nội dung bài viết
    // Thử các editor phổ biến: textarea, TinyMCE, CKEditor, Quill
    let contentFilled = false

    // Thử textarea thường
    const contentSelectors = [
      'textarea[name="content"]',
      'textarea[name="body"]',
      '#content',
      '#editor',
    ]
    for (const sel of contentSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 2000 })
        await page.click(sel)
        await page.evaluate((sel: string, text: string) => {
          const el = document.querySelector(sel) as HTMLTextAreaElement
          if (el) el.value = text
        }, sel, article.content)
        contentFilled = true
        console.log(`[Publisher] Đã điền content vào textarea`)
        break
      } catch {}
    }

    // Thử TinyMCE
    if (!contentFilled) {
      try {
        await page.waitForSelector('.tox-edit-area__iframe', { timeout: 3000 })
        await page.evaluate((content: string) => {
          if ((window as any).tinymce) {
            (window as any).tinymce.activeEditor.setContent(content)
          }
        }, article.content)
        contentFilled = true
        console.log(`[Publisher] Đã điền content vào TinyMCE`)
      } catch {}
    }

    // Thử CKEditor
    if (!contentFilled) {
      try {
        await page.evaluate((content: string) => {
          const ck = (window as any).CKEDITOR
          if (ck) {
            const editorName = Object.keys(ck.instances)[0]
            if (editorName) ck.instances[editorName].setData(content)
          }
        }, article.content)
        contentFilled = true
        console.log(`[Publisher] Đã điền content vào CKEditor`)
      } catch {}
    }

    // BƯỚC 5: AI chọn danh mục phù hợp
    const selectedCategory = await selectCategory(page, article)
    console.log(`[Publisher] Đã chọn danh mục: ${selectedCategory}`)

    // BƯỚC 6: Điền Meta Title
    const metaSelectors = [
      'input[name="meta_title"]',
      'input[name="seo_title"]',
      '#meta-title',
      '#seo_title',
    ]
    for (const sel of metaSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 2000 })
        await page.click(sel, { clickCount: 3 })
        await page.type(sel, article.title, { delay: 20 })
        break
      } catch {}
    }

    // BƯỚC 7: Điền Meta Description
    if (article.metaDescription) {
      const metaDescSelectors = [
        'textarea[name="meta_description"]',
        'textarea[name="seo_description"]',
        '#meta-description',
        '#seo_description',
        'input[name="meta_description"]',
      ]
      for (const sel of metaDescSelectors) {
        try {
          await page.waitForSelector(sel, { timeout: 2000 })
          await page.click(sel, { clickCount: 3 })
          await page.type(sel, article.metaDescription, { delay: 20 })
          break
        } catch {}
      }
    }

    // BƯỚC 8: Điền Meta Keywords
    if (article.metaKeywords) {
      const metaKwSelectors = [
        'input[name="meta_keywords"]',
        'input[name="seo_keywords"]',
        '#meta-keywords',
      ]
      for (const sel of metaKwSelectors) {
        try {
          await page.waitForSelector(sel, { timeout: 2000 })
          await page.click(sel, { clickCount: 3 })
          await page.type(sel, article.metaKeywords, { delay: 20 })
          break
        } catch {}
      }
    }

    await page.waitForTimeout(500)

    // BƯỚC 9: Submit / Lưu bài
    const saveSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Lưu")',
      'button:contains("Đăng")',
      'button:contains("Publish")',
      '.btn-save',
      '.btn-submit',
      '#submit-btn',
    ]

    let submitted = false
    for (const sel of saveSelectors) {
      try {
        const btn = await page.$(sel)
        if (btn) {
          await btn.click()
          submitted = true
          console.log(`[Publisher] Đã click submit: ${sel}`)
          break
        }
      } catch {}
    }

    if (!submitted) {
      // Thử click button cuối cùng trong form
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button[type="submit"], input[type="submit"]')
        if (btns.length > 0) (btns[btns.length - 1] as HTMLElement).click()
      })
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})

    const finalUrl = page.url()
    console.log(`[Publisher] Xong! URL sau submit: ${finalUrl}`)

    await browser.close()

    return {
      success: true,
      message: `Đã đăng bài "${article.title}" lên website thành công!`,
      postUrl: finalUrl,
      selectedCategory,
    }

  } catch (error: any) {
    if (browser) await browser.close().catch(() => {})
    console.error('[Publisher] Lỗi:', error)
    return {
      success: false,
      message: 'Không thể đăng bài tự động',
      error: error.message,
    }
  }
}

// AI tự chọn danh mục phù hợp dựa trên nội dung bài
async function selectCategory(page: any, article: ArticleToPublish): Promise<string> {
  try {
    // Lấy danh sách tất cả option trong select category
    const categoryData = await page.evaluate(() => {
      const selectors = [
        'select[name="category_id"]',
        'select[name="category"]',
        '#category_id',
        '#category',
        'select[name*="categor"]',
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLSelectElement
        if (el) {
          return {
            selector: sel,
            options: Array.from(el.options).map(o => ({ value: o.value, text: o.text.trim() }))
          }
        }
      }
      return null
    })

    if (!categoryData || categoryData.options.length === 0) {
      return 'Không tìm thấy select category'
    }

    // AI chọn category phù hợp nhất dựa trên keyword và intent
    const categories = categoryData.options.filter((o: any) => o.value && o.value !== '0')
    const keyword = article.keyword.toLowerCase()

    let bestCategory = categories[0]
    let bestScore = 0

    for (const cat of categories) {
      const catName = cat.text.toLowerCase()
      let score = 0

      // So khớp từ khóa với tên category
      const keywordWords = keyword.split(' ')
      for (const word of keywordWords) {
        if (word.length > 3 && catName.includes(word)) score += 2
      }

      // Ưu tiên theo intent
      if (article.intent === 'Informational' && (catName.includes('hướng dẫn') || catName.includes('kinh nghiệm') || catName.includes('tin tức'))) score += 3
      if (article.intent === 'Commercial' && (catName.includes('so sánh') || catName.includes('đánh giá') || catName.includes('review'))) score += 3
      if (article.intent === 'Transactional' && (catName.includes('mua bán') || catName.includes('giá') || catName.includes('khuyến mãi'))) score += 3

      if (score > bestScore) {
        bestScore = score
        bestCategory = cat
      }
    }

    // Chọn category trong dropdown
    await page.select(categoryData.selector, bestCategory.value)
    return bestCategory.text

  } catch (err) {
    return 'Không chọn được category'
  }
}
