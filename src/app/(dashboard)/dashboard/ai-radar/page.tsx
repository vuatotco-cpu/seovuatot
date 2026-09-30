'use client'

import { useState, useEffect } from 'react'
import { Brain, Loader2, Search, Zap, TrendingUp, Target, CheckSquare, ArrowRight, RefreshCw, PenSquare, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Opportunity {
  id?: string
  keyword: string
  suggestedTitle: string
  type: 'High Intent' | 'Content Gap' | 'Easy Rank' | '2026 Trend'
  intent: 'Transactional' | 'Commercial' | 'Informational' | 'Navigational'
  kd: number
  kdLabel: string
  volume: string
  rationale: string
  status?: string
}

interface Website { id: string; domain: string; name: string; niche?: string }

const INTENT_LABEL: Record<string, string> = { Transactional: 'Giao Dịch', Commercial: 'Thương Mại', Informational: 'Thông Tin', Navigational: 'Điều Hướng' }
const INTENT_STYLE: Record<string, string> = { Transactional: 'bg-green-100 text-green-700', Commercial: 'bg-purple-100 text-purple-700', Informational: 'bg-blue-100 text-blue-700', Navigational: 'bg-gray-100 text-gray-600' }
const TYPE_LABEL: Record<string, string> = { 'High Intent': 'Ý Định Cao', 'Content Gap': 'Khoảng Trống', 'Easy Rank': 'Dễ Rank', '2026 Trend': 'Xu Hướng 2026' }
const TYPE_STYLE: Record<string, string> = { 'High Intent': 'bg-orange-100 text-orange-700', 'Content Gap': 'bg-blue-100 text-blue-700', 'Easy Rank': 'bg-green-100 text-green-700', '2026 Trend': 'bg-yellow-100 text-yellow-700' }
const kdColor = (kd: number) => kd <= 10 ? 'bg-green-100 text-green-700' : kd <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'

export default function AIRadarPage() {
  const [scanning, setScanning] = useState(false)
  const [filter, setFilter] = useState('all')
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [customKeyword, setCustomKeyword] = useState('')

  useEffect(() => {
    fetch('/api/websites').then(r => r.json()).then(d => {
      const sites = d.websites ?? []
      setWebsites(sites)
      if (sites.length > 0) {
        setSelectedSiteId(sites[0].id)
        loadOpportunities(sites[0].id)
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [])

  const loadOpportunities = async (websiteId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ai-radar/opportunities?website_id=${websiteId}`)
      const data = await res.json()
      setOpportunities(data.opportunities?.map((o: Record<string, unknown>) => ({
        id: o.id as string,
        keyword: o.keyword as string,
        suggestedTitle: (o.suggested_title ?? '') as string,
        type: o.type as Opportunity['type'],
        intent: o.intent as Opportunity['intent'],
        kd: o.kd as number,
        kdLabel: (o.kd_label ?? '') as string,
        volume: (o.volume_range ?? '') as string,
        rationale: (o.rationale ?? '') as string,
        status: o.status as string,
      })) ?? [])
    } catch {}
    setLoading(false)
  }

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId)
    setOpportunities([])
    loadOpportunities(siteId)
  }

  const handleScan = async () => {
    if (!selectedSiteId && websites.length > 0) { toast.error('Chọn website để quét'); return }
    const site = websites.find(s => s.id === selectedSiteId)
    setScanning(true)
    toast.info('AI đang quét cơ hội từ khóa...', { duration: 15000 })
    try {
      const res = await fetch('/api/ai-radar/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: site?.domain ?? 'website',
          niche: site?.niche ?? 'sàn thương mại điện tử',
        }),
      })
      const data = await res.json()
      if (res.ok && data.opportunities) {
        // Save to DB
        await fetch('/api/ai-radar/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunities: data.opportunities, website_id: selectedSiteId }),
        })
        await loadOpportunities(selectedSiteId)
        toast.success(`AI tìm được ${data.opportunities.length} cơ hội! (${data.ai_model})`)
      } else {
        toast.error(`Quét thất bại: ${data.error || `HTTP ${res.status}`}`)
      }
    } catch (err: unknown) {
      toast.error(`Lỗi: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    setScanning(false)
  }

  const handleAddCustomKeyword = async () => {
    if (!customKeyword.trim()) return
    const opp: Opportunity = {
      keyword: customKeyword.trim(),
      suggestedTitle: customKeyword.trim(),
      type: 'Content Gap',
      intent: 'Informational',
      kd: 20,
      kdLabel: 'Dễ',
      volume: '—',
      rationale: 'Từ khóa thêm thủ công',
    }
    await fetch('/api/ai-radar/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunities: [opp], website_id: selectedSiteId }),
    })
    setCustomKeyword('')
    await loadOpportunities(selectedSiteId)
    toast.success('Đã thêm từ khóa')
  }

  const handleDismiss = async (id?: string, keyword?: string) => {
    if (id) {
      await fetch('/api/ai-radar/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'dismissed' }),
      })
    }
    setOpportunities(prev => prev.filter(o => o.keyword !== keyword))
  }

  const filtered = filter === 'all' ? opportunities : opportunities.filter(o => o.type === filter)
  const toggleSelect = (kw: string) => setSelected(prev => { const n = new Set(prev); n.has(kw) ? n.delete(kw) : n.add(kw); return n })

  const totalOpportunities = opportunities.length
  const trend2026 = opportunities.filter(o => o.type === '2026 Trend').length
  const contentGaps = opportunities.filter(o => o.type === 'Content Gap').length
  const easyRank = opportunities.filter(o => o.type === 'Easy Rank').length

  const FILTERS = [
    { key: 'all', label: 'Tất cả', count: totalOpportunities },
    { key: '2026 Trend', label: 'Xu Hướng 2026', count: trend2026 },
    { key: 'Content Gap', label: 'Khoảng Trống ND', count: contentGaps },
    { key: 'Easy Rank', label: 'Dễ Lên Top 1-3', count: easyRank },
    { key: 'High Intent', label: 'Ý Định Chuyển Đổi', count: opportunities.filter(o => o.type === 'High Intent').length },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-600" /> AI Market Radar
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Khám phá khoảng trống nội dung, từ khóa cạnh tranh thấp và xu hướng tăng trưởng.</p>
        </div>
        <div className="flex items-center gap-3">
          {websites.length > 0 ? (
            <select value={selectedSiteId} onChange={e => handleSiteChange(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
              {websites.map(s => <option key={s.id} value={s.id}>{s.domain}</option>)}
            </select>
          ) : (
            <span className="text-xs text-gray-400">Chưa có website</span>
          )}
          <button onClick={handleScan} disabled={scanning || websites.length === 0}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {scanning ? 'Đang quét...' : 'Tìm Cơ Hội AI'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-6xl mx-auto w-full">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Tổng Cơ Hội', value: totalOpportunities, sub: 'Khoảng trống & xu hướng', icon: Target, color: 'text-brand-600 bg-brand-50' },
            { label: 'Xu Hướng 2026', value: trend2026, sub: 'Tăng trưởng mạnh', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
            { label: 'Khoảng Trống ND', value: contentGaps, sub: 'Đối thủ chưa làm', icon: Search, color: 'text-blue-600 bg-blue-50' },
            { label: 'Dễ Lên Top', value: easyRank, sub: 'KD thấp < 20', icon: Zap, color: 'text-green-600 bg-green-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs font-medium text-gray-700 leading-tight">{s.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Opportunities Table */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">AI Keyword Opportunities</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ưu tiên cơ hội theo xu hướng, khoảng trống và intent chuyển đổi.</p>
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <Link href={`/dashboard/content/new?keyword=${encodeURIComponent(Array.from(selected)[0])}`}
                  className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 font-medium">
                  <PenSquare className="w-3.5 h-3.5" /> Viết {selected.size} bài đã chọn
                </Link>
              )}
              <button onClick={handleScan} disabled={scanning}
                className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50">
                {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Quét lại
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-5 py-2 border-b border-gray-50 flex items-center gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={cn('text-xs px-3 py-1 rounded-full font-medium transition-colors', filter === f.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {f.label} <span className="ml-1 opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Add custom keyword */}
          <div className="px-5 py-2 border-b border-gray-50 flex items-center gap-2">
            <input value={customKeyword} onChange={e => setCustomKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustomKeyword()}
              placeholder="Thêm từ khóa tùy chỉnh..." className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500" />
            <button onClick={handleAddCustomKeyword} className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Thêm
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
            <div className="col-span-1" />
            <div className="col-span-4">Từ Khóa & Tiêu Đề Gợi Ý</div>
            <div className="col-span-2 text-center">Loại Cơ Hội</div>
            <div className="col-span-2 text-center">Ý Định</div>
            <div className="col-span-2 text-center">KD / Volume</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Brain className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {websites.length === 0 ? 'Thêm website trước khi quét cơ hội' : 'Nhấn "Tìm Cơ Hội AI" để quét'}
              </p>
              {websites.length === 0 && (
                <Link href="/dashboard/websites" className="text-xs text-brand-600 hover:underline mt-2 inline-block">Thêm website →</Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((opp, idx) => (
                <div key={idx} className={cn('grid grid-cols-12 gap-3 px-5 py-3.5 items-start hover:bg-gray-50 transition-colors', selected.has(opp.keyword) && 'bg-brand-50/50')}>
                  <div className="col-span-1 flex items-center justify-center pt-0.5">
                    <input type="checkbox" checked={selected.has(opp.keyword)} onChange={() => toggleSelect(opp.keyword)} className="accent-brand-600 w-4 h-4" />
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{opp.keyword}</p>
                    {opp.suggestedTitle && <p className="text-[10px] text-brand-600 mt-0.5 leading-tight">"{opp.suggestedTitle.slice(0, 55)}..."</p>}
                    {opp.rationale && <p className="text-[10px] text-gray-400 mt-1 leading-snug line-clamp-2">{opp.rationale}</p>}
                  </div>
                  <div className="col-span-2 flex justify-center pt-0.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', TYPE_STYLE[opp.type] ?? 'bg-gray-100 text-gray-600')}>{TYPE_LABEL[opp.type] || opp.type}</span>
                  </div>
                  <div className="col-span-2 flex justify-center pt-0.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', INTENT_STYLE[opp.intent] ?? 'bg-gray-100 text-gray-600')}>{INTENT_LABEL[opp.intent] || opp.intent}</span>
                  </div>
                  <div className="col-span-2 text-center pt-0.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', kdColor(opp.kd ?? 50))}>KD {opp.kd ?? '?'} · {opp.kdLabel}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{opp.volume}</p>
                  </div>
                  <div className="col-span-1 flex flex-col items-end gap-1 pt-0.5">
                    <Link href={`/dashboard/content/new?keyword=${encodeURIComponent(opp.keyword)}&title=${encodeURIComponent(opp.suggestedTitle ?? opp.keyword)}`}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap">
                      <PenSquare className="w-3.5 h-3.5" /> Viết
                    </Link>
                    <button onClick={() => handleDismiss(opp.id, opp.keyword)} className="text-[10px] text-gray-300 hover:text-red-400">Bỏ qua</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Cơ hội được lưu 7 ngày. Quét lại để cập nhật.</span>
          <Link href="/dashboard/keywords" className="text-brand-600 hover:underline flex items-center gap-1">
            Nghiên cứu từ khóa chi tiết <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
