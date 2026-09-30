import { NextRequest, NextResponse } from 'next/server'
import { generateArticleImage } from '@/lib/image-generator'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { keyword, title } = await req.json()

  if (!keyword) {
    return NextResponse.json({ error: 'Thiếu từ khóa' }, { status: 400 })
  }

  const image = await generateArticleImage(keyword, title || keyword)

  return NextResponse.json({
    success: true,
    image,
    message: image.source === 'dalle'
      ? 'Ảnh được tạo bởi DALL-E 3'
      : image.source === 'unsplash'
        ? `Ảnh từ Unsplash${image.credit ? ` - ${image.credit}` : ''}`
        : 'Ảnh placeholder (thêm API key để dùng AI)',
  })
}
