// AI Router - Tự động chuyển sang AI kế tiếp khi hết key hoặc lỗi
//
// Thứ tự ưu tiên CONTENT:
//   1. Claude Sonnet  (chất lượng cao nhất, tiếng Việt tốt)
//   2. Claude Haiku   (nhanh + rẻ, cùng hãng)
//   3. Gemini 1.5 Pro (Google, miễn phí 15 req/phút)
//   4. GPT-4o         (dùng chung key OpenAI với DALL-E)
//   5. DeepSeek Chat  (rẻ nhất, OpenAI-compatible)
//
// Thứ tự ưu tiên IMAGE:
//   1. DALL-E 3       (OpenAI)
//   2. Stability AI   (Stable Diffusion Ultra)
//   3. Unsplash       (ảnh thật miễn phí)
//   4. Placeholder    (SVG gradient — luôn hoạt động)

export interface AITextResult {
  content: string
  model: string
  provider: 'claude' | 'gemini' | 'openai' | 'groq' | 'deepseek'
}

export interface AIImageResult {
  url: string
  source: 'dalle' | 'stability' | 'unsplash' | 'placeholder'
  alt: string
  credit?: string
}

// ═══════════════════════════════════════════════════════════
// CONTENT GENERATION — fallback tự động
// ═══════════════════════════════════════════════════════════

export async function generateWithAI(
  prompt: string,
  systemPrompt = 'Bạn là chuyên gia SEO content writer tiếng Việt.'
): Promise<AITextResult> {
  const providers = [
    tryClaude('claude-sonnet-4-5'),
    tryClaude('claude-haiku-4-5-20251001'),
    tryGemini('gemini-1.5-pro'),
    tryGroq('llama-3.1-70b-versatile'),
    tryGPT4o('gpt-4o'),
    tryDeepSeek('deepseek-chat'),
  ]

  const errors: string[] = []

  for (const provider of providers) {
    try {
      const result = await provider(prompt, systemPrompt)
      if (result) {
        console.log(`[AI Router] Dùng: ${result.provider} / ${result.model}`)
        return result
      }
    } catch (err: any) {
      errors.push(`${err?.message || err}`)
      console.log(`[AI Router] Lỗi, thử AI tiếp theo...`)
    }
  }

  throw new Error(`Tất cả AI đều lỗi: ${errors.slice(-2).join(' | ')}`)
}

// Claude (Sonnet hoặc Haiku)
function tryClaude(model: string) {
  return async (prompt: string, systemPrompt: string): Promise<AITextResult | null> => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey.includes('...')) return null

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })

    const res = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = res.content[0].type === 'text' ? res.content[0].text : ''
    if (!content) return null
    return { content, model, provider: 'claude' }
  }
}

// Google Gemini
function tryGemini(model: string) {
  return async (prompt: string, systemPrompt: string): Promise<AITextResult | null> => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.includes('...')) return null

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const gemini = genAI.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
    })

    const result = await gemini.generateContent(prompt)
    const content = result.response.text()
    if (!content) return null
    return { content, model, provider: 'gemini' }
  }
}

// OpenAI GPT-4o
function tryGPT4o(model: string) {
  return async (prompt: string, systemPrompt: string): Promise<AITextResult | null> => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.includes('...')) return null

    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey })

    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
    })

    const content = res.choices[0]?.message?.content || ''
    if (!content) return null
    return { content, model, provider: 'openai' }
  }
}

// Groq (OpenAI-compatible, free tier — Llama 3.1 70B)
function tryGroq(model: string) {
  return async (prompt: string, systemPrompt: string): Promise<AITextResult | null> => {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey.includes('...') || apiKey.length < 10) return null

    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
    })

    const content = res.choices[0]?.message?.content || ''
    if (!content) return null
    return { content, model, provider: 'groq' }
  }
}

// DeepSeek (OpenAI-compatible API)
function tryDeepSeek(model: string) {
  return async (prompt: string, systemPrompt: string): Promise<AITextResult | null> => {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey || apiKey.includes('...')) return null

    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    })

    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
    })

    const content = res.choices[0]?.message?.content || ''
    if (!content) return null
    return { content, model, provider: 'deepseek' }
  }
}

// ═══════════════════════════════════════════════════════════
// IMAGE GENERATION — fallback tự động
// ═══════════════════════════════════════════════════════════

export async function generateImageWithAI(
  keyword: string,
  title: string
): Promise<AIImageResult> {
  const generators = [
    tryDallE3,
    tryStabilityAI,
    tryUnsplash,
  ]

  for (const gen of generators) {
    try {
      const result = await gen(keyword, title)
      if (result) {
        console.log(`[AI Router] Ảnh từ: ${result.source}`)
        return result
      }
    } catch (err) {
      console.log(`[AI Router] Image lỗi, thử nguồn tiếp theo...`)
    }
  }

  // Luôn có placeholder cuối cùng
  return makePlaceholder(keyword)
}

// DALL-E 3 (OpenAI)
async function tryDallE3(keyword: string, title: string): Promise<AIImageResult | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.includes('...')) return null

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey })

  const prompt = buildImagePrompt(keyword, title)
  const res = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    style: 'natural',
  })

  const url = res.data?.[0]?.url
  if (!url) return null
  return { url, source: 'dalle', alt: title }
}

// Stability AI (Stable Diffusion Ultra)
async function tryStabilityAI(keyword: string, title: string): Promise<AIImageResult | null> {
  const apiKey = process.env.STABILITY_API_KEY
  if (!apiKey || apiKey.includes('...')) return null

  const prompt = buildImagePrompt(keyword, title)

  const formData = new FormData()
  formData.append('prompt', prompt)
  formData.append('output_format', 'jpeg')
  formData.append('aspect_ratio', '16:9')

  const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'image/*',
    },
    body: formData,
  })

  if (!res.ok) return null

  const buffer = Buffer.from(await res.arrayBuffer())
  const base64 = buffer.toString('base64')
  const dataUrl = `data:image/jpeg;base64,${base64}`

  return { url: dataUrl, source: 'stability', alt: keyword }
}

// Unsplash (ảnh thật miễn phí)
async function tryUnsplash(keyword: string): Promise<AIImageResult | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey || accessKey.includes('your-')) return null

  const query = translateKeyword(keyword)
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  )

  if (!res.ok) return null
  const data = await res.json()
  const url = data.urls?.regular
  if (!url) return null

  return {
    url,
    source: 'unsplash',
    alt: keyword,
    credit: `Photo by ${data.user?.name} on Unsplash`,
  }
}

// SVG Placeholder (fallback cuối cùng)
function makePlaceholder(keyword: string): AIImageResult {
  const palettes = [
    ['#0ea5e9', '#8b5cf6'],
    ['#10b981', '#0ea5e9'],
    ['#f59e0b', '#ef4444'],
    ['#8b5cf6', '#ec4899'],
    ['#06b6d4', '#10b981'],
  ]
  const pair = palettes[Math.abs(keyword.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % palettes.length]

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${pair[0]}"/>
      <stop offset="100%" style="stop-color:${pair[1]}"/>
    </linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="600" y="315" font-family="Arial" font-size="44" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${keyword}</text>
  </svg>`

  return {
    url: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    source: 'placeholder',
    alt: keyword,
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function buildImagePrompt(keyword: string, title: string): string {
  const topic = keyword.toLowerCase()
  const en = translateKeyword(keyword)

  if (topic.match(/laptop|điện thoại|máy tính|tablet/))
    return `Professional tech product photography, ${en}, clean studio background, sharp focus, commercial quality, Vietnam market`
  if (topic.match(/xe máy|ô tô|xe/))
    return `Automotive photography, ${en}, showroom lighting, clean modern background, professional commercial quality`
  if (topic.match(/nội thất|bàn ghế|tủ|sofa/))
    return `Interior design photography, ${en}, modern Vietnamese home, warm natural lighting, lifestyle photography`
  if (topic.match(/quần áo|thời trang|giày/))
    return `Fashion photography, ${en}, clean white background, professional model, Vietnamese lifestyle`

  return `Professional blog header for article "${en}", clean modern design, Vietnamese marketplace context, high quality photography, 16:9 format`
}

function translateKeyword(keyword: string): string {
  const map: Record<string, string> = {
    'điện thoại': 'smartphone', 'laptop': 'laptop', 'xe máy': 'motorcycle',
    'ô tô': 'car', 'nội thất': 'furniture', 'quần áo': 'clothing',
    'đồ cũ': 'second hand goods', 'mua bán': 'marketplace trading',
    'giá rẻ': 'affordable', 'chất lượng': 'quality', 'hướng dẫn': 'guide',
    'thanh lý': 'clearance sale', 'mẹo': 'tips', 'bí quyết': 'secrets',
    'sách': 'books', 'nhà': 'house home', 'đất': 'real estate land',
  }
  let result = keyword.toLowerCase()
  for (const [vi, en] of Object.entries(map)) result = result.replace(new RegExp(vi, 'g'), en)
  return result.trim() || 'Vietnam second-hand marketplace'
}

// ═══════════════════════════════════════════════════════════
// STATUS — kiểm tra AI nào đang hoạt động
// ═══════════════════════════════════════════════════════════

export function getAIStatus() {
  const PLACEHOLDERS = ['...', 'your-', 'sk-ant-api03']
  const check = (val: string | undefined) =>
    !!(val && val.trim().length > 10 && !PLACEHOLDERS.some(p => val.includes(p)))

  return {
    claude:    { active: check(process.env.ANTHROPIC_API_KEY),  label: 'Claude (Anthropic)' },
    gemini:    { active: check(process.env.GEMINI_API_KEY),     label: 'Gemini (Google)' },
    groq:      { active: check(process.env.GROQ_API_KEY),       label: 'Groq — Llama 3.1 70B' },
    openai:    { active: check(process.env.OPENAI_API_KEY),     label: 'GPT-4o (OpenAI)' },
    deepseek:  { active: check(process.env.DEEPSEEK_API_KEY),   label: 'DeepSeek' },
    stability: { active: check(process.env.STABILITY_API_KEY),  label: 'Stability AI' },
    unsplash:  { active: check(process.env.UNSPLASH_ACCESS_KEY), label: 'Unsplash' },
  }
}
