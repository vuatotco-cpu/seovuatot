import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithAI } from '@/lib/ai-router'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, url, diagnosis } = await req.json()

  // Get the decay item
  const { data: item } = await supabase
    .from('content_decay')
    .select('*, articles(title, target_keyword, content)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!item) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  const title = item.articles?.title ?? 'bài viết'
  const keyword = item.articles?.target_keyword ?? ''

  const prompt = `Bài viết "${title}" (từ khóa: ${keyword}) đang bị suy giảm thứ hạng.

Chẩn đoán: ${diagnosis || 'Nội dung cũ, cần cập nhật'}

Tạo kế hoạch cập nhật ngắn gọn (200-300 từ) bao gồm:
1. 3-5 điểm nội dung cần thêm/cập nhật
2. Từ khóa LSI cần lồng ghép
3. Phần nào cần viết lại
4. 2-3 ý tưởng nội dung mới để tăng chiều sâu
5. Đề xuất cấu trúc H2/H3 mới nếu cần

Trả lời bằng tiếng Việt, chi tiết và thực tế.`

  try {
    const { content: fix_draft } = await generateWithAI(prompt, 'Bạn là chuyên gia SEO Việt Nam, hãy đưa ra kế hoạch cập nhật chi tiết.')

    // Update the decay record
    await supabase.from('content_decay')
      .update({ ai_fix_draft: fix_draft, status: 'fixing' })
      .eq('id', id)

    return NextResponse.json({ fix_draft, success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Lỗi AI' }, { status: 500 })
  }
}
