'use client'

import { useState, useEffect } from 'react'
import {
  TrendingDown, AlertTriangle, Loader2, RefreshCw, Brain,
  CheckCircle, Globe, ArrowUp, ArrowDown, Minus, Zap, PenSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DecayItem {
  id: string
  url?: string
  article_id?: string
  avg_position_before?: number
  avg_position_after?: number
  traffic_drop_pct?: number
  impressions_before?: number
  impressions_after?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  ai_diagnosis?: string
  ai_fix_draft?: string
  status: 'detected' | 'fixing' | 'fixed' | 'dismissed'
  detected_at: string
  articles?: { title: string; target_keyword: string }
}

interface Website { id: string; domain: string; name: string }

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}
const SEVERITY_LABEL: Record<string, string> = { critical: 'Nghiêm trọng', high: 'Cao', medium: 'Trung bình', low: 'Thấp' }

const STATUS_STYLE: Record<string, string> = {
  detected: 'bg-red-50 text-red-600',
  fixing: 'bg-yellow-50 text-yellow-600',
  fixed: 'bg-green-50 text-green-600',
  dismissed: 'bg-gray-50 text-gray-400',
}

export default function RankTrackingPage() {
  const [items, setItems] = useState<DecayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [fixing, setFixing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/websites').then(r => r.json()).then(d => {
      const sites = d.websites ?? []
      setWebsites(sites)
      if (sites.length > 0) {
        setSelectedSiteId(sites[0].id)
        loadDecay(sites[0].id)
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [])

  const loadDecay = async (websiteId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/content-decay?website_id=${websiteId}`)
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {}
    setLoading(false)
  }

  const handleSiteChange = (id: string) => {
    setSelectedSiteId(id)
    loadDecay(id)
  }

  const handleScanDecay = async () => {
    if (!selectedSiteId) { toast.error('Chọn website để quét'); return }
    const site = websites.find(s => s.id === selectedSiteId)
    setScanning(true)
    toast.info('AI đang phân tích suy giảm nội dung...', { duration: 20000 })
    try {
      const res = await fetch('/api/content-decay/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: selectedSiteId, domain: site?.domain }),
      })
      const data = await res.json()
      if (res.ok) {
        await loadDecay(selectedSiteId)
        toast.success(`Phát hiện ${data.detected ?? 0} bài suy giảm`)
      } else {
        toast.error(data.error || 'Quét thất bại')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi')
    }
    setScanning(false)
  }

  const handleFix = async (item: DecayItem) => {
    setFixing(item.id)
    try {
      const res = await fetch('/api/content-decay/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, url: item.url, diagnosis: item.ai_diagnosis }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('AI đã tạo bản fix — kiểm tra trong Duyệt bài')
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'fixing', ai_fix_draft: data.fix_draft } : i))
      } else {
        toast.error(data.error || 'Lỗi tạo fix')
      }
    } catch { toast.error('Lỗi') }
    setFixing(null)
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch('/api/content-decay', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: status as DecayItem['status'] } : i))
  }

  const critical = items.filter(i => i.severity === 'critical' || i.severity === 'high')
  const active = items.filter(i => i.status !== 'dismissed' && i.status !== 'fixed')

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-brand-600" /> Content Decay & Rank Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Phát hiện bài viết suy giảm thứ hạng, AI chẩn đoán và tạo bản fix tự động</p>
        </div>
        <div className="flex items-center gap-3">
          {websites.length > 0 && (
            <select value={selectedSiteId} onChange={e => handleSiteChange(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
              {websites.map(s => <option key={s.id} value={s.id}>{s.domain}</option>)}
            </select>
          )}
          <button onClick={() => loadDecay(selectedSiteId)} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button onClick={handleScanDecay} disabled={scanning || !selectedSiteId}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {scanning ? 'Đang quét...' : 'Quét Suy Giảm'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Tổng phát hiện', value: items.length, icon: Globe, color: 'text-brand-600 bg-brand-50' },
            { label: 'Nghiêm trọng', value: critical.length, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
            { label: 'Cần xử lý', value: active.length, icon: TrendingDown, color: 'text-orange-600 bg-orange-50' },
            { label: 'Đã sửa', value: items.filter(i => i.status === 'fixed').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Critical alert */}
        {critical.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">{critical.length} bài bị suy giảm nghiêm trọng</p>
              <p className="text-sm text-red-600 mt-0.5">Cần tối ưu gấp — thứ hạng tụt mạnh trong 30 ngày qua</p>
            </div>
          </div>
        )}

        {/* Decay list */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Danh sách bài suy giảm</h2>
            <span className="text-xs text-gray-400">{items.length} bài</span>
          </div>

          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" /></div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <TrendingDown className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {websites.length === 0 ? 'Thêm website trước' : 'Nhấn "Quét Suy Giảm" để phân tích'}
              </p>
              <p className="text-xs text-gray-400 mt-1">AI sẽ kết nối GSC và phân tích bài viết giảm thứ hạng</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map(item => (
                <div key={item.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.articles?.title ?? item.url ?? 'Bài viết'}
                        </p>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border', SEVERITY_STYLE[item.severity])}>
                          {SEVERITY_LABEL[item.severity]}
                        </span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_STYLE[item.status])}>
                          {item.status === 'detected' ? 'Phát hiện' : item.status === 'fixing' ? 'Đang sửa' : item.status === 'fixed' ? 'Đã sửa' : 'Bỏ qua'}
                        </span>
                      </div>
                      {item.url && <p className="text-xs text-gray-400 truncate mb-2">{item.url}</p>}

                      {/* Position change */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {item.avg_position_before != null && item.avg_position_after != null && (
                          <span className="flex items-center gap-1">
                            Vị trí: #{item.avg_position_before.toFixed(1)}
                            <ArrowDown className="w-3 h-3 text-red-400" />
                            <span className="text-red-600 font-semibold">#{item.avg_position_after.toFixed(1)}</span>
                          </span>
                        )}
                        {item.traffic_drop_pct != null && (
                          <span className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="w-3 h-3" /> -{item.traffic_drop_pct.toFixed(0)}% traffic
                          </span>
                        )}
                        {item.impressions_before != null && item.impressions_after != null && (
                          <span>
                            Impressions: {item.impressions_before.toLocaleString()} → {item.impressions_after.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* AI diagnosis */}
                      {item.ai_diagnosis && (
                        <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                          <p className="text-xs font-semibold text-orange-700 mb-1">AI Chẩn Đoán:</p>
                          <p className="text-xs text-orange-800 leading-relaxed">{item.ai_diagnosis}</p>
                        </div>
                      )}

                      {/* Fix draft */}
                      {expanded === item.id && item.ai_fix_draft && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                          <p className="text-xs font-semibold text-green-700 mb-1">AI Fix Draft:</p>
                          <p className="text-xs text-green-800 leading-relaxed whitespace-pre-wrap">{item.ai_fix_draft}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {item.status === 'detected' && (
                        <button onClick={() => handleFix(item)} disabled={fixing === item.id}
                          className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50">
                          {fixing === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          AI Fix
                        </button>
                      )}
                      {item.article_id && (
                        <Link href={`/dashboard/content/${item.article_id}`}
                          className="flex items-center gap-1 text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                          <PenSquare className="w-3 h-3" /> Sửa bài
                        </Link>
                      )}
                      {item.ai_fix_draft && (
                        <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                          className="text-xs text-brand-600 hover:underline">
                          {expanded === item.id ? 'Ẩn fix' : 'Xem fix'}
                        </button>
                      )}
                      {item.status !== 'fixed' && item.status !== 'dismissed' && (
                        <button onClick={() => handleUpdateStatus(item.id, 'dismissed')}
                          className="text-xs text-gray-400 hover:text-gray-600">Bỏ qua</button>
                      )}
                      {item.status === 'fixing' && (
                        <button onClick={() => handleUpdateStatus(item.id, 'fixed')}
                          className="flex items-center gap-1 text-xs text-green-600 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-50">
                          <CheckCircle className="w-3 h-3" /> Đã sửa xong
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-400 text-center">
          Kết nối Google Search Console để phát hiện suy giảm tự động. AI phân tích dựa trên dữ liệu GSC 28 ngày.
        </div>
      </div>
    </div>
  )
}
