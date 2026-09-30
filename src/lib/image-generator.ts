// Image Generator - tạo ảnh thumbnail cho bài viết
// Ưu tiên: DALL-E 3 → Unsplash → placeholder

export interface GeneratedImage {
  url: string
  source: 'dalle' | 'unsplash' | 'placeholder'
  alt: string
  credit?: string
}

// DALL-E 3 - tạo ảnh AI theo nội dung bài
export async function generateWithDalle(keyword: string, title: string): Promise<GeneratedImage | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'sk-...') return null

  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey })

    // Tạo prompt ảnh phù hợp tiếng Việt và chủ đề
    const prompt = buildImagePrompt(keyword, title)

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024', // Tỉ lệ 16:9 phù hợp thumbnail blog
      quality: 'standard',
      style: 'natural',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) return null

    return {
      url: imageUrl,
      source: 'dalle',
      alt: title,
    }
  } catch (err) {
    console.error('[ImageGen] DALL-E error:', err)
    return null
  }
}

// Unsplash - ảnh thật miễn phí (fallback)
export async function generateWithUnsplash(keyword: string): Promise<GeneratedImage | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey || accessKey === 'your-unsplash-access-key') return null

  try {
    // Dịch keyword sang tiếng Anh để tìm ảnh tốt hơn
    const searchQuery = translateKeywordForSearch(keyword)

    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(searchQuery)}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    )

    if (!res.ok) return null
    const data = await res.json()

    return {
      url: data.urls?.regular || data.urls?.full,
      source: 'unsplash',
      alt: keyword,
      credit: `Photo by ${data.user?.name} on Unsplash`,
    }
  } catch (err) {
    console.error('[ImageGen] Unsplash error:', err)
    return null
  }
}

// Placeholder - fallback cuối cùng (gradient đẹp)
export function generatePlaceholder(keyword: string): GeneratedImage {
  // Tạo màu gradient ngẫu nhiên dựa trên keyword
  const colors = [
    ['#0ea5e9', '#8b5cf6'],
    ['#10b981', '#0ea5e9'],
    ['#f59e0b', '#ef4444'],
    ['#8b5cf6', '#ec4899'],
    ['#06b6d4', '#10b981'],
  ]
  const colorPair = colors[Math.abs(keyword.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length]

  // SVG placeholder với gradient và text
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colorPair[0]}"/>
        <stop offset="100%" style="stop-color:${colorPair[1]}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="600" y="315" font-family="Arial" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${keyword}</text>
  </svg>`

  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

  return {
    url: dataUrl,
    source: 'placeholder',
    alt: keyword,
  }
}

// Hàm chính: thử tuần tự DALL-E → Unsplash → Placeholder
export async function generateArticleImage(keyword: string, title: string): Promise<GeneratedImage> {
  // Thử DALL-E 3 trước
  const dalle = await generateWithDalle(keyword, title)
  if (dalle) return dalle

  // Fallback sang Unsplash
  const unsplash = await generateWithUnsplash(keyword)
  if (unsplash) return unsplash

  // Cuối cùng dùng placeholder
  return generatePlaceholder(keyword)
}

// Tải ảnh từ URL về buffer (để upload lên server)
export async function downloadImage(url: string): Promise<Buffer | null> {
  if (url.startsWith('data:')) {
    // Base64 data URL
    const base64 = url.split(',')[1]
    return Buffer.from(base64, 'base64')
  }

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

// Helper: build prompt phù hợp cho ảnh blog Việt Nam
function buildImagePrompt(keyword: string, title: string): string {
  const topic = keyword.toLowerCase()

  // Phát hiện loại nội dung để tạo prompt phù hợp
  if (topic.includes('laptop') || topic.includes('điện thoại') || topic.includes('máy tính')) {
    return `Professional product photography of ${translateKeywordForSearch(keyword)}, clean white background, studio lighting, high quality, commercial style, Vietnam market`
  }
  if (topic.includes('xe máy') || topic.includes('ô tô') || topic.includes('xe')) {
    return `Professional automotive photography, ${translateKeywordForSearch(keyword)}, showroom setting, clean background, commercial quality`
  }
  if (topic.includes('mua bán') || topic.includes('thương mại') || topic.includes('chợ')) {
    return `Vietnamese online marketplace concept, people buying and selling goods, modern e-commerce, clean design, professional photography`
  }
  if (topic.includes('nội thất') || topic.includes('bàn ghế') || topic.includes('tủ')) {
    return `Beautiful furniture photography, ${translateKeywordForSearch(keyword)}, interior design, modern Vietnamese home, natural lighting`
  }

  // Default: concept ảnh đẹp phù hợp
  return `Professional blog header image for article about "${translateKeywordForSearch(keyword)}", clean modern design, Vietnamese context, high quality photography, 16:9 aspect ratio`
}

// Helper: dịch keyword sang tiếng Anh để search Unsplash
function translateKeywordForSearch(keyword: string): string {
  const map: Record<string, string> = {
    'mua bán': 'buying selling',
    'đồ cũ': 'second hand goods',
    'điện thoại': 'smartphone phone',
    'laptop': 'laptop computer',
    'xe máy': 'motorcycle',
    'ô tô': 'car automobile',
    'nội thất': 'furniture interior',
    'quần áo': 'clothing fashion',
    'sách': 'books',
    'giá rẻ': 'affordable',
    'uy tín': 'trusted reliable',
    'chất lượng': 'quality',
    'hướng dẫn': 'guide tutorial',
    'kinh nghiệm': 'experience tips',
    'thanh lý': 'clearance sale',
    'cũ': 'used secondhand',
  }

  let result = keyword.toLowerCase()
  for (const [vi, en] of Object.entries(map)) {
    result = result.replace(new RegExp(vi, 'g'), en)
  }
  return result.trim() || 'Vietnam marketplace'
}
