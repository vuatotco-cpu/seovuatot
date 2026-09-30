'use client'

import { useEffect, useState } from 'react'
import {
  Brain, ChevronDown, ChevronRight, FileText, Globe, Loader2,
  Play, Sparkles, Target, Zap, CheckCircle, RefreshCw,
  AlertCircle, Tag, Users, Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useWebsite } from '@/contexts/WebsiteContext'

// ── Types ──────────────────────────────────────────────────────
interface WebsiteProfile {
  niche: string
  niche_description: string
  language: string
  entity_tags: string[]
  main_topics: string[]
  target_audience: string
  content_style: string
  competitors: string[]
  pillar_suggestions: string[]
}

interface ProjectDetail {
  id: string
  domain: string
  niche?: string
  niche_description?: string
  language?: string
  entity_tags?: string[]
  entity_profile?: WebsiteProfile
  analysis_status: 'pending' | 'analyzing' | 'done' | 'error'
}

interface ClusterArticle {
  id: string
  type: 'pillar' | 'cluster'
  keyword: string
  title: string
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational'
  estimated_kd: number
  estimated_volume: string
  priority: 'high' | 'medium' | 'low'
  pillar_id?: string
  reason: string
}

interface TopicCluster {
  pillar_topic: string
  pillar_article: ClusterArticle
  cluster_articles: ClusterArticle[]
}

// ── Storage helpers ────────────────────────────────────────────
const DETAIL_KEY = (id: string) => `seo_project_detail_${id}`
const CLUSTER_KEY = (id: string) => `seo_clusters_v2_${id}`

function loadDetail(id: string): ProjectDetail | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(DETAIL_KEY(id)) || 'null') } catch { return null }
}
function saveDetail(detail: ProjectDetail) {
  localStorage.setItem(DETAIL_KEY(detail.id), JSON.stringify(detail))
}
function loadClusters(id: string): TopicCluster[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(CLUSTER_KEY(id)) || '[]') } catch { return [] }
}
function saveClusters(id: string, clusters: TopicCluster[]) {
  localStorage.setItem(CLUSTER_KEY(id), JSON.stringify(clusters))
}

// ── Color helpers ──────────────────────────────────────────────
const INTENT_COLOR: Record<string, string> = {
  Informational: 'bg-blue-50 text-blue-700',
  Commercial: 'bg-purple-50 text-purple-700',
  Transactional: 'bg-green-50 text-green-700',
  Navigational: 'bg-gray-100 text-gray-600',
}
const INTENT_VI: Record<string, string> = {
  Informational: 'Thông tin', Commercial: 'Thương mại',
  Transactional: 'Giao dịch', Navigational: 'Điều hướng',
}
const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  low: 'bg-gray-50 text-gray-600 border border-gray-200',
}
const PRIORITY_VI: Record<string, string> = {
  high: 'Ưu tiên cao', medium: 'Trung bình', low: 'Thấp',
}
function kdColor(kd: number) {
  if (kd <= 15) return 'text-green-700 bg-green-50'
  if (kd <= 30) return 'text-yellow-700 bg-yellow-50'
  return 'text-red-700 bg-red-50'
}

// ══════════════════════════════════════════════════════════════
export default function TopicClusterPage() {
  const { selected: website } = useWebsite()

  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [clusters, setClusters] = useState<TopicCluster[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [generatingArticle, setGeneratingArticle] = useState<string | null>(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [generatingClusters, setGeneratingClusters] = useState(false)
  const [aiModel, setAiModel] = useState('')

  // Load stored detail + clusters whenever selected website changes
  useEffect(() => {
    if (!website) { setDetail(null); setClusters([]); return }
    const stored = loadDetail(website.id)
    setDetail(stored || { id: website.id, domain: website.domain, analysis_status: 'pending' })
    setClusters(loadClusters(website.id))
    setExpanded({})
    setChecked(new Set())
    setAiModel('')
  }, [website?.id])

  // ── Analyze website ──────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!website) return
    setAnalyzing(true)
    setDetail(d => d ? { ...d, analysis_status: 'analyzing' } : null)
    toast.info(`AI đang phân tích ${website.domain}...`, { duration: 15000 })

    try {
      const res = await fetch(`/api/projects/${website.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: website.domain }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Phân tích thất bại')

      const profile: WebsiteProfile = data.profile
      const updated: ProjectDetail = {
        id: website.id,
        domain: website.domain,
        niche: profile.niche,
        niche_description: profile.niche_description,
        language: profile.language,
        entity_tags: profile.entity_tags,
        entity_profile: profile,
        analysis_status: 'done',
      }
      setDetail(updated)
      saveDetail(updated)
      toast.success(`Xong! Niche: ${profile.niche}`)
    } catch (err: any) {
      setDetail(d => d ? { ...d, analysis_status: 'error' } : null)
      toast.error(err.message || 'Phân tích thất bại')
    }
    setAnalyzing(false)
  }

  // ── Generate clusters ────────────────────────────────────────
  const handleGenerateClusters = async () => {
    if (!website) return
    setGeneratingClusters(true)
    toast.info('AI đang tạo kế hoạch Topic Cluster...', { duration: 25000 })

    try {
      const profile = detail?.entity_profile
      const res = await fetch(`/api/projects/${website.id}/topic-cluster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: website.domain,
          niche: detail?.niche || profile?.niche,
          niche_description: detail?.niche_description || profile?.niche_description,
          target_audience: profile?.target_audience,
          language: detail?.language || 'vi',
          pillar_suggestions: profile?.pillar_suggestions || [],
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Lỗi tạo cluster')

      setClusters(data.clusters)
      saveClusters(website.id, data.clusters)

      const exp: Record<string, boolean> = {}
      data.clusters.forEach((c: TopicCluster) => { exp[c.pillar_article.id] = true })
      setExpanded(exp)
      setAiModel(`${data.ai_provider} / ${data.ai_model}`)
      toast.success(`Đã tạo kế hoạch ${data.total_articles} bài viết!`)
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo topic cluster')
    }
    setGeneratingClusters(false)
  }

  // ── Write article ────────────────────────────────────────────
  const handleWriteArticle = async (article: ClusterArticle) => {
    setGeneratingArticle(article.id)
    toast.info(`Đang viết: "${article.title}"...`, { duration: 10000 })
    try {
      const res = await fetch('/api/cron/daily-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: true,
          single_article: { keyword: article.keyword, title: article.title, intent: article.intent },
        }),
      })
      const data = await res.json()
      toast.success(data.success || data.articles_generated > 0
        ? `Đã viết xong! Vào Duyệt bài để xem.`
        : (data.message || 'Xong — kiểm tra Duyệt bài.')
      )
    } catch {
      toast.error('Lỗi khi tạo bài')
    }
    setGeneratingArticle(null)
  }

  const handleWriteSelected = async () => {
    if (checked.size === 0) { toast.error('Chọn ít nhất 1 bài'); return }
    const all = clusters.flatMap(c => [c.pillar_article, ...c.cluster_articles])
    const toWrite = all.filter(a => checked.has(a.id)).slice(0, 3)
    toast.info(`Đang tạo ${toWrite.length} bài...`, { duration: 20000 })
    for (const a of toWrite) await handleWriteArticle(a)
  }

  const toggleCheck = (id: string) =>
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const selectAll = () =>
    setChecked(new Set(clusters.flatMap(c => [c.pillar_article.id, ...c.cluster_articles.map(a => a.id)])))

  const totalArticles = clusters.reduce((s, c) => s + 1 + c.cluster_articles.length, 0)

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-600" /> Kế Hoạch Nội Dung
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              AI phân tích website và lên kế hoạch Topic Cluster — chọn website ở góc phải trên
            </p>
          </div>
          {clusters.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{checked.size}/{totalArticles} đã chọn</span>
              <button onClick={selectAll} className="text-sm text-brand-600 hover:underline">Chọn tất cả</button>
              <button
                onClick={handleWriteSelected}
                disabled={checked.size === 0}
                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" /> Viết {checked.size} bài ngay
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── No website selected ── */}
        {!website && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <Globe className="w-10 h-10 text-brand-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa chọn website</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Click vào dropdown <strong>góc phải trên</strong> để thêm website hoặc chọn website có sẵn.
            </p>
          </div>
        )}

        {/* ── Website selected ── */}
        {website && (
          <>
            {/* Analysis card */}
            {detail?.analysis_status !== 'done' && (
              <div className={cn(
                'rounded-2xl border p-5',
                detail?.analysis_status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-100'
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    detail?.analysis_status === 'analyzing' ? 'bg-blue-50'
                      : detail?.analysis_status === 'error' ? 'bg-red-100' : 'bg-purple-50'
                  )}>
                    {detail?.analysis_status === 'analyzing'
                      ? <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      : detail?.analysis_status === 'error'
                        ? <AlertCircle className="w-6 h-6 text-red-500" />
                        : <Brain className="w-6 h-6 text-purple-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {detail?.analysis_status === 'analyzing'
                        ? `Đang phân tích ${website.domain}...`
                        : detail?.analysis_status === 'error'
                          ? 'Phân tích thất bại — thử lại'
                          : `Phân tích website: ${website.domain}`
                      }
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {detail?.analysis_status === 'analyzing'
                        ? 'AI đang đọc nội dung trang chủ, xác định niche, đối tượng và đối thủ cạnh tranh...'
                        : 'AI sẽ tự phát hiện niche, đối tượng mục tiêu, đối thủ và đề xuất chủ đề pillar.'
                      }
                    </p>
                    {detail?.analysis_status !== 'analyzing' && (
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="mt-3 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-brand-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        {analyzing
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích...</>
                          : <><Sparkles className="w-4 h-4" /> Phân tích website ngay</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile card */}
            {detail?.analysis_status === 'done' && detail.entity_profile && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-brand-600" />
                      <span className="font-bold text-gray-900">{website.domain}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Đã phân tích
                      </span>
                    </div>
                    <p className="text-base font-semibold text-brand-700">{detail.niche}</p>
                    {detail.niche_description && (
                      <p className="text-sm text-gray-500 mt-0.5">{detail.niche_description}</p>
                    )}
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    title="Phân tích lại"
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-4 h-4', analyzing && 'animate-spin')} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Thực thể
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(detail.entity_tags || []).map(tag => (
                        <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Đối tượng
                    </p>
                    <p className="text-sm text-gray-700">{detail.entity_profile.target_audience}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Đối thủ
                    </p>
                    {detail.entity_profile.competitors?.slice(0, 3).map(c => (
                      <p key={c} className="text-xs text-gray-600 truncate">{c}</p>
                    ))}
                  </div>
                </div>
                {(detail.entity_profile.pillar_suggestions || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Gợi ý Pillar Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {detail.entity_profile.pillar_suggestions.map(s => (
                        <span key={s} className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-lg">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate clusters button */}
            {detail?.analysis_status === 'done' && (
              <div className={cn(
                'rounded-2xl border p-5',
                clusters.length > 0 ? 'bg-white border-gray-100' : 'bg-gradient-to-r from-purple-50 to-brand-50 border-purple-100'
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {clusters.length > 0 ? 'Kế Hoạch Đã Tạo' : 'Tạo Topic Cluster AI'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {clusters.length > 0
                        ? `${totalArticles} bài trong ${clusters.length} cluster${aiModel ? ` · ${aiModel}` : ''}`
                        : 'AI tạo 4 Pillar Page + 20-24 Cluster Articles phù hợp niche website'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateClusters}
                    disabled={generatingClusters}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 ml-4 flex-shrink-0"
                  >
                    {generatingClusters
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</>
                      : <><Sparkles className="w-4 h-4" /> {clusters.length > 0 ? 'Tạo lại' : 'Tạo kế hoạch'}</>
                    }
                  </button>
                </div>
                {clusters.length > 0 && (
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-700">{totalArticles}</p>
                      <p className="text-xs text-gray-500">Bài kế hoạch</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-brand-700">{clusters.length}</p>
                      <p className="text-xs text-gray-500">Pillar pages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {clusters.reduce((s, c) => s + c.cluster_articles.length, 0)}
                      </p>
                      <p className="text-xs text-gray-500">Cluster articles</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm text-gray-600">Thời gian hoàn thành</p>
                      <p className="text-xs text-gray-400">~{Math.round(totalArticles / 3)} ngày (3 bài/ngày)</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cluster list */}
            {clusters.length > 0 && (
              <div className="space-y-3">
                {clusters.map(cluster => (
                  <div key={cluster.pillar_article.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {/* Pillar row */}
                    <div
                      className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpanded(p => ({ ...p, [cluster.pillar_article.id]: !p[cluster.pillar_article.id] }))}
                    >
                      <input type="checkbox"
                        checked={checked.has(cluster.pillar_article.id)}
                        onChange={e => { e.stopPropagation(); toggleCheck(cluster.pillar_article.id) }}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 accent-brand-600"
                      />
                      <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-brand-600 uppercase">PILLAR PAGE</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', PRIORITY_BADGE[cluster.pillar_article.priority])}>
                            {PRIORITY_VI[cluster.pillar_article.priority]}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900 truncate">{cluster.pillar_article.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">🔑 {cluster.pillar_article.keyword} · {cluster.cluster_articles.length} cluster articles</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-xs px-2 py-1 rounded-lg', INTENT_COLOR[cluster.pillar_article.intent])}>
                          {INTENT_VI[cluster.pillar_article.intent]}
                        </span>
                        <span className={cn('text-xs px-2 py-1 rounded-lg font-medium', kdColor(cluster.pillar_article.estimated_kd))}>
                          KD {cluster.pillar_article.estimated_kd}
                        </span>
                        <span className="text-xs text-gray-400 hidden lg:block">{cluster.pillar_article.estimated_volume}/tháng</span>
                        <button
                          onClick={e => { e.stopPropagation(); handleWriteArticle(cluster.pillar_article) }}
                          disabled={generatingArticle === cluster.pillar_article.id}
                          className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-600 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 disabled:opacity-50"
                        >
                          {generatingArticle === cluster.pillar_article.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Play className="w-3 h-3" />
                          }
                          Viết ngay
                        </button>
                        {expanded[cluster.pillar_article.id]
                          ? <ChevronDown className="w-4 h-4 text-gray-400" />
                          : <ChevronRight className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                    </div>

                    {/* Cluster articles */}
                    {expanded[cluster.pillar_article.id] && (
                      <div>
                        {cluster.cluster_articles.map((article, idx) => (
                          <div
                            key={article.id}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60',
                              idx < cluster.cluster_articles.length - 1 && 'border-b border-gray-50'
                            )}
                          >
                            <input type="checkbox"
                              checked={checked.has(article.id)}
                              onChange={() => toggleCheck(article.id)}
                              className="w-4 h-4 accent-brand-600 ml-11"
                            />
                            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{article.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500">🔑 {article.keyword}</span>
                                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', INTENT_COLOR[article.intent])}>
                                  {INTENT_VI[article.intent]}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={cn('text-xs px-2 py-0.5 rounded-lg', kdColor(article.estimated_kd))}>
                                KD {article.estimated_kd}
                              </span>
                              <span className="text-xs text-gray-400 hidden lg:block w-24 text-right">{article.estimated_volume}/tháng</span>
                              <button
                                onClick={() => handleWriteArticle(article)}
                                disabled={generatingArticle === article.id}
                                className="text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {generatingArticle === article.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <><Play className="w-3 h-3" /> Viết</>
                                }
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* CTA */}
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-brand-900">Bắt đầu viết tự động mỗi ngày?</p>
                    <p className="text-sm text-brand-700 mt-0.5">AI tự chọn bài từ kế hoạch này, viết và chờ bạn duyệt lúc 7h sáng</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/dashboard/review" className="flex items-center gap-2 text-sm text-brand-600 border border-brand-300 px-4 py-2 rounded-xl hover:bg-brand-100">
                      <CheckCircle className="w-4 h-4" /> Xem bài chờ duyệt
                    </Link>
                    <button
                      onClick={handleWriteSelected}
                      disabled={checked.size === 0}
                      className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      {checked.size > 0 ? `Viết ${checked.size} bài` : 'Chọn bài để viết'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty clusters prompt */}
            {detail?.analysis_status === 'done' && clusters.length === 0 && !generatingClusters && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">Chưa có kế hoạch nội dung</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Nhấn "Tạo kế hoạch" ở trên để AI tạo 4 Pillar Page + 20-24 Cluster Articles.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
