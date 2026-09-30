import { NextRequest, NextResponse } from 'next/server'
import { generateWithAI } from '@/lib/ai-router'

export const maxDuration = 120

export interface ClusterArticle {
  id: string
  type: 'pillar' | 'cluster'
  keyword: string
  title: string
  intent: 'Informational' | 'Commercial' | 'Transactional'
  estimated_kd: number
  estimated_volume: string
  priority: 'high' | 'medium' | 'low'
  pillar_id?: string   // cluster articles link to a pillar
  reason: string
}

export interface TopicCluster {
  pillar_topic: string
  pillar_article: ClusterArticle
  cluster_articles: ClusterArticle[]
}

export async function POST(req: NextRequest) {
  const { niche, website_url, target_audience, existing_content = [] } = await req.json()

  const website = website_url || 'website của bạn'
  const audience = target_audience || 'người dùng quan tâm đến lĩnh vực này'

  const prompt = `Bạn là chuyên gia SEO Topic Cluster. Tạo kế hoạch nội dung đầy đủ cho website: ${website}

THÔNG TIN WEBSITE:
- Niche: ${niche || 'Chưa xác định — hãy suy luận từ domain'}
- Đối tượng: ${audience}
- Nội dung đã có: ${existing_content.length > 0 ? existing_content.join(', ') : 'Chưa có bài viết nào'}

YÊU CẦU:
Tạo 4 Topic Cluster, mỗi cluster gồm:
- 1 Pillar Page (bài tổng hợp dài 2000-3000 từ, KD thấp-trung bình)
- 5-6 Cluster Articles (bài chi tiết 1000-1500 từ, KD rất thấp)

QUAN TRỌNG: Phân tích thực sự dựa trên niche của website, không hard-code cho bất kỳ lĩnh vực cụ thể nào.

Trả về JSON:
[
  {
    "pillar_topic": "Tên chủ đề lớn",
    "pillar_article": {
      "id": "p1",
      "type": "pillar",
      "keyword": "từ khóa pillar",
      "title": "Tiêu đề bài pillar",
      "intent": "Informational",
      "estimated_kd": 25,
      "estimated_volume": "1000-2000",
      "priority": "high",
      "reason": "Lý do ngắn tại sao quan trọng"
    },
    "cluster_articles": [
      {
        "id": "c1_1",
        "type": "cluster",
        "keyword": "từ khóa cụ thể",
        "title": "Tiêu đề bài cluster",
        "intent": "Informational|Commercial|Transactional",
        "estimated_kd": 10,
        "estimated_volume": "200-500",
        "priority": "high|medium|low",
        "pillar_id": "p1",
        "reason": "Lý do ngắn"
      }
    ]
  }
]

Tổng cộng 4 pillar + 20-24 cluster articles. Chỉ trả về JSON, không text khác.`

  try {
    const result = await generateWithAI(prompt, 'Bạn là chuyên gia SEO Content Strategy cho thị trường Việt Nam.')
    const text = result.content.trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const clusters: TopicCluster[] = JSON.parse(jsonMatch?.[0] || text)

    // Đếm tổng
    const totalArticles = clusters.reduce((s, c) => s + 1 + c.cluster_articles.length, 0)

    return NextResponse.json({
      success: true,
      clusters,
      total_articles: totalArticles,
      ai_model: result.model,
      ai_provider: result.provider,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tạo topic cluster' }, { status: 500 })
  }
}
