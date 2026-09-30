import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWithAI } from '@/lib/ai-router'

export const maxDuration = 120

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || url.includes('your-project') || !key || key.includes('your-')) return null
  return createClient(url, key)
}

// GET — lấy clusters đã lưu cho project
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ clusters: [], db_connected: false })

  const { data: pillars, error } = await supabase
    .from('pillar_topics')
    .select('*, cluster_articles(*)')
    .eq('project_id', params.id)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clusters = (pillars || []).map((p) => ({
    pillar_id: p.id,
    pillar_topic: p.title,
    pillar_article: {
      id: p.id,
      type: 'pillar' as const,
      keyword: p.keyword,
      title: p.title,
      intent: p.intent || 'Informational',
      estimated_kd: p.kd_estimate || 25,
      estimated_volume: p.volume_estimate || '500-1000',
      priority: (p.kd_estimate || 25) <= 20 ? 'high' : (p.kd_estimate || 25) <= 40 ? 'medium' : 'low',
      reason: p.description || '',
      status: p.status,
    },
    cluster_articles: (p.cluster_articles || []).map((a: any) => ({
      id: a.id,
      type: 'cluster' as const,
      keyword: a.keyword,
      title: a.title,
      intent: a.intent || 'Informational',
      estimated_kd: a.kd_estimate || 15,
      estimated_volume: a.volume_estimate || '200-500',
      priority: a.priority <= 2 ? 'high' : a.priority === 3 ? 'medium' : 'low',
      pillar_id: p.id,
      reason: a.rationale || '',
      status: a.status,
    })),
  }))

  return NextResponse.json({ clusters, db_connected: true })
}

// POST — tạo clusters mới bằng AI rồi lưu vào DB
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const {
    domain,
    niche,
    niche_description,
    target_audience,
    language = 'vi',
    pillar_suggestions = [],
  } = await req.json()

  if (!domain) return NextResponse.json({ error: 'Thiếu domain' }, { status: 400 })

  const langNote = language === 'vi'
    ? 'Toàn bộ từ khóa và tiêu đề phải bằng tiếng Việt.'
    : `Ngôn ngữ website: ${language}. Từ khóa và tiêu đề theo ngôn ngữ website.`

  const pillarHint = pillar_suggestions.length > 0
    ? `\nGợi ý chủ đề pillar từ phân tích:\n${pillar_suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`
    : ''

  const prompt = `Bạn là chuyên gia SEO Content Strategy. Tạo kế hoạch Topic Cluster đầy đủ cho website:

WEBSITE: ${domain}
NICHE: ${niche || 'Chưa xác định'}
MÔ TẢ: ${niche_description || ''}
ĐỐI TƯỢNG: ${target_audience || 'Người dùng quan tâm đến lĩnh vực này'}
${pillarHint}

YÊU CẦU: ${langNote}
Tạo 4 Topic Cluster, mỗi cluster gồm:
- 1 Pillar Page (bài tổng hợp dài 2000-3000 từ, KD thấp-trung bình)
- 5-6 Cluster Articles (bài chi tiết 1000-1500 từ, KD rất thấp)

QUAN TRỌNG:
- Không hard-code cho website cụ thể nào, hãy phân tích thực sự dựa trên niche và domain
- Tránh cannibalization: không 2 bài có cùng search intent và keyword gốc
- Đa dạng intent: mix Informational, Commercial, Transactional
- Ưu tiên từ khóa long-tail, KD thấp (< 35), volume thực tế

Trả về JSON:
[
  {
    "pillar_topic": "Tên chủ đề pillar",
    "pillar_article": {
      "id": "p1",
      "type": "pillar",
      "keyword": "từ khóa pillar chính",
      "title": "Tiêu đề bài pillar (55-65 ký tự)",
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
        "keyword": "từ khóa cluster cụ thể",
        "title": "Tiêu đề bài cluster (55-65 ký tự)",
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
    const result = await generateWithAI(
      prompt,
      'Bạn là chuyên gia SEO Content Strategy, phân tích bất kỳ website nào một cách khách quan.'
    )

    const text = result.content.trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const clusters = JSON.parse(jsonMatch?.[0] || text)
    const totalArticles = clusters.reduce(
      (s: number, c: any) => s + 1 + c.cluster_articles.length,
      0
    )

    // Lưu vào DB nếu có
    const supabase = getSupabase()
    if (supabase) {
      // Xóa clusters cũ của project
      await supabase.from('pillar_topics').delete().eq('project_id', params.id)

      // Insert từng pillar + cluster
      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i]
        const pa = cluster.pillar_article

        const { data: pillarRow, error: pillarErr } = await supabase
          .from('pillar_topics')
          .insert({
            project_id: params.id,
            title: pa.title,
            keyword: pa.keyword,
            volume_estimate: pa.estimated_volume,
            kd_estimate: pa.estimated_kd,
            intent: pa.intent,
            description: pa.reason,
            sort_order: i,
          })
          .select()
          .single()

        if (pillarErr || !pillarRow) continue

        const clusterRows = cluster.cluster_articles.map((ca: any) => ({
          project_id: params.id,
          pillar_id: pillarRow.id,
          title: ca.title,
          keyword: ca.keyword,
          volume_estimate: ca.estimated_volume,
          kd_estimate: ca.estimated_kd,
          intent: ca.intent,
          priority: ca.priority === 'high' ? 1 : ca.priority === 'medium' ? 3 : 5,
          rationale: ca.reason,
        }))

        if (clusterRows.length > 0) {
          await supabase.from('cluster_articles').insert(clusterRows)
        }
      }
    }

    return NextResponse.json({
      success: true,
      clusters,
      total_articles: totalArticles,
      ai_model: result.model,
      ai_provider: result.provider,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Lỗi khi tạo topic cluster' },
      { status: 500 }
    )
  }
}
