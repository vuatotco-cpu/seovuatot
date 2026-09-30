'use client'

import { useState } from 'react'
import { Brain, Loader2, Search, Zap, TrendingUp, Target, CheckSquare, ArrowRight, RefreshCw, PenSquare, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Opportunity {
  keyword: string
  suggestedTitle: string
  type: 'High Intent' | 'Content Gap' | 'Easy Rank' | '2026 Trend'
  intent: 'Transactional' | 'Commercial' | 'Informational' | 'Navigational'
  kd: number
  kdLabel: string
  volume: string
  rationale: string
  selected?: boolean
}

const ENTITY_TAGS = ['#mua bán đồ cũ', '#thanh lý đồ cũ toàn quốc', '#đăng tin rao vặt đồ cũ', '#chợ đồ cũ online']

const DEMO_OPPORTUNITIES: Opportunity[] = [
  { keyword: 'cách nhận biết người bán uy tín', suggestedTitle: 'Mẹo nhận biết người bán uy tín trên sàn thương mại điện tử', type: 'High Intent', intent: 'Transactional', kd: 10, kdLabel: 'Rất dễ', volume: '150-300 lượt/tháng', rationale: 'Tăng cường niềm tin vào nền tảng C2C, từ khóa long-tail ít đối thủ' },
  { keyword: 'cách nhận diện người bán lừa đảo', suggestedTitle: 'Hướng dẫn nhận diện người bán lừa đảo trên sàn đồ cũ', type: 'High Intent', intent: 'Commercial', kd: 8, kdLabel: 'Rất dễ', volume: '200-400 lượt/tháng', rationale: 'Tận dụng tính năng Huy Hiệu Vương Miện' },
  { keyword: 'có nên mua điện thoại cũ trả góp', suggestedTitle: 'Mua điện thoại cũ trả góp tại Vua Tốt: Có đáng không?', type: 'High Intent', intent: 'Transactional', kd: 15, kdLabel: 'Rất dễ', volume: '150-300 lượt/tháng', rationale: 'Chuyển người dùng đang phân vân sang hành động' },
  { keyword: 'cách nhận biết người bán lừa đảo', suggestedTitle: 'Cách nhận diện người bán lừa đảo đồ cũ online', type: 'High Intent', intent: 'Informational', kd: 10, kdLabel: 'Rất dễ', volume: '150-300 lượt/tháng', rationale: 'Xây dựng lòng tin cho người mua đồ cũ lần đầu' },
  { keyword: 'so sánh mua laptop cũ tại vuatot', suggestedTitle: 'So sánh mua laptop cũ tại Vua Tốt vs các nền tảng khác', type: 'Content Gap', intent: 'Commercial', kd: 18, kdLabel: 'Rất dễ', volume: '250-400 lượt/tháng', rationale: 'Người dùng đang phân vân và so sánh nền tảng' },
  { keyword: 'có nên mua xe máy cũ chính chủ', suggestedTitle: 'Có nên mua xe máy cũ chính chủ? Kinh nghiệm từ A-Z', type: 'Content Gap', intent: 'Commercial', kd: 15, kdLabel: 'Rất dễ', volume: '400-750 lượt/tháng', rationale: 'Từ khóa đánh vào tâm lý người mua xe máy cũ' },
  { keyword: 'thủ tục sang tên xe máy cũ', suggestedTitle: 'Hướng dẫn thủ tục sang tên xe máy cũ chi tiết 2026', type: '2026 Trend', intent: 'Transactional', kd: 14, kdLabel: 'Rất dễ', volume: '450-800 lượt/tháng', rationale: 'Nhu cầu pháp lý tất yếu sau khi mua xe' },
  { keyword: 'kinh nghiệm mua đồ cũ online', suggestedTitle: 'Kinh nghiệm mua đồ cũ online an toàn 2026', type: '2026 Trend', intent: 'Informational', kd: 12, kdLabel: 'Rất dễ', volume: '500-900 lượt/tháng', rationale: 'Xu hướng mua sắm bền vững tăng mạnh 2026' },
  { keyword: 'mua laptop cũ ở đâu uy tín', suggestedTitle: 'Mua laptop cũ ở đâu uy tín nhất Việt Nam 2026?', type: 'Easy Rank', intent: 'Commercial', kd: 20, kdLabel: 'Dễ', volume: '600-1000 lượt/tháng', rationale: 'Người dùng đang tìm nền tảng, cơ hội cao' },
  { keyword: 'cách kiểm tra pin điện thoại cũ', suggestedTitle: 'Cách kiểm tra pin điện thoại cũ chính xác nhất', type: 'Easy Rank', intent: 'Informational', kd: 9, kdLabel: 'Rất dễ', volume: '300-500 lượt/tháng', rationale: 'How-to content viral, dễ được Google Featured Snippet' },
]

const FILTERS = [
  { key: 'all', label: 'Tất cả', count: DEMO_OPPORTUNITIES.length },
  { key: '2026 Trend', label: 'Xu Hướng 2026', count: DEMO_OPPORTUNITIES.filter(o => o.type === '2026 Trend').length },
  { key: 'Content Gap', label: 'Khoảng Trống ND', count: DEMO_OPPORTUNITIES.filter(o => o.type === 'Content Gap').length },
  { key: 'Easy Rank', label: 'Dễ Lên Top 1-3', count: DEMO_OPPORTUNITIES.filter(o => o.type === 'Easy Rank').length },
  { key: 'High Intent', label: 'Ý Định Chuyển Đổi', count: DEMO_OPPORTUNITIES.filter(o => o.type === 'High Intent').length },
]

const INTENT_LABEL: Record<string, string> = {
  Transactional: 'Giao Dịch',
  Commercial: 'Thương Mại',
  Informational: 'Thông Tin',
  Navigational: 'Điều Hướng',
}

const INTENT_STYLE: Record<string, string> = {
  Transactional: 'bg-green-100 text-green-700',
  Commercial: 'bg-purple-100 text-purple-700',
  Informational: 'bg-blue-100 text-blue-700',
  Navigational: 'bg-gray-100 text-gray-600',
}

const TYPE_LABEL: Record<string, string> = {
  'High Intent': 'Ý Định Cao',
  'Content Gap': 'Khoảng Trống',
  'Easy Rank': 'Dễ Rank',
  '2026 Trend': 'Xu Hướng 2026',
}

const TYPE_STYLE: Record<string, string> = {
  'High Intent': 'bg-orange-100 text-orange-700',
  'Content Gap': 'bg-blue-100 text-blue-700',
  'Easy Rank': 'bg-green-100 text-green-700',
  '2026 Trend': 'bg-yellow-100 text-yellow-700',
}

export default function AIRadarPage() {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(true) // show demo by default
  const [filter, setFilter] = useState('all')
  const [selectedTags, setSelectedTags] = useState(ENTITY_TAGS)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(DEMO_OPPORTUNITIES)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleScan = async () => {
    setScanning(true)
    toast.info('AI đang quét cơ hội từ khóa...', { duration: 12000 })
    try {
      const res = await fetch('/api/ai-radar/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: 'vuatot.vn', niche: 'sàn thương mại điện tử C2C đồ cũ' }),
      })
      const data = await res.json()
      if (res.ok && data.opportunities) {
        setOpportunities(data.opportunities)
        setScanned(true)
        toast.success(`AI tìm được ${data.opportunities.length} cơ hội mới!`)
      } else {
        toast.error(`Quét thất bại: ${data.error || `HTTP ${res.status}`}`)
      }
    } catch (err: any) {
      toast.error(`Lỗi kết nối server: ${err.message}`)
    }
    setScanning(false)
  }

  const filtered = filter === 'all' ? opportunities : opportunities.filter(o => o.type === filter)

  const toggleSelect = (kw: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(kw)) next.delete(kw)
      else next.add(kw)
      return next
    })
  }

  const kdColor = (kd: number) =>
    kd <= 10 ? 'bg-green-100 text-green-700' : kd <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'

  const totalOpportunities = opportunities.length
  const trend2026 = opportunities.filter(o => o.type === '2026 Trend').length
  const contentGaps = opportunities.filter(o => o.type === 'Content Gap').length
  const easyRank = opportunities.filter(o => o.type === 'Easy Rank').length

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
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option>vuatot.vn</option>
          </select>
          <button onClick={handleScan} disabled={scanning}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {scanning ? 'Đang quét...' : 'Tìm Cơ Hội AI'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-6xl mx-auto w-full">

        {/* Entity Profile */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">V</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">Hồ Sơ Thực Thể Website: vuatot.vn</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Đã xác minh từ web thực tế
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                  Vua Tốt chuyên dịch từ một nền tảng rao vặt sang thị hệ sinh thái mua bán đồ cũ uy tín. Chiến lược tập trung vào đánh vào các từ khóa "kinh nghiệm kiểm tra hàng cũ" (E-E-A-T) và các từ khóa ngách theo khu vực địa lý để chiếm lĩnh thị phần các đối thủ lớn.
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-gray-500">Entities & Keywords extracted from Web:</span>
                  {selectedTags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      {tag}
                      <button onClick={() => setSelectedTags(p => p.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-600 ml-0.5">×</button>
                    </span>
                  ))}
                  <button className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add keyword
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleScan} disabled={scanning}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              <RefreshCw className={cn('w-3.5 h-3.5', scanning && 'animate-spin')} /> Quét lại website
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Tổng Cơ Hội Phát Hiện', value: totalOpportunities, sub: 'Khoảng trống & xu hướng mới', icon: Target, color: 'text-brand-600 bg-brand-50' },
            { label: 'Xu Hướng Nóng 2026', value: trend2026, sub: 'Tăng trưởng tìm kiếm mạnh', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
            { label: 'Khoảng Trống Đối Thủ', value: contentGaps, sub: 'Đối thủ lớn chưa làm', icon: Search, color: 'text-blue-600 bg-blue-50' },
            { label: 'Từ Khóa Dễ Lên Top', value: easyRank, sub: 'Ít cạnh tranh (KD thấp)', icon: Zap, color: 'text-green-600 bg-green-50' },
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
                <Link
                  href={`/dashboard/content/new?keyword=${encodeURIComponent(Array.from(selected)[0])}`}
                  className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 font-medium"
                >
                  <PenSquare className="w-3.5 h-3.5" /> Viết {selected.size} bài đã chọn
                </Link>
              )}
              <button
                onClick={handleScan}
                disabled={scanning}
                className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 flex items-center gap-1 disabled:opacity-50"
              >
                {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {scanning ? 'Đang quét...' : 'Quét thêm'}
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-5 py-2 border-b border-gray-50 flex items-center gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={cn('text-xs px-3 py-1 rounded-full font-medium transition-colors',
                  filter === f.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}>
                {f.label} <span className="ml-1 opacity-70">{f.count}</span>
              </button>
            ))}
            {/* Written count */}
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
              <CheckSquare className="w-3 h-3" /> Đã viết {opportunities.filter(o => false).length} bài
            </span>
          </div>

          {/* Table */}
          <div className="divide-y divide-gray-50">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
              <div className="col-span-1" />
              <div className="col-span-4">Từ Khóa & Tiêu Đề Gợi Ý</div>
              <div className="col-span-2 text-center">Loại Cơ Hội</div>
              <div className="col-span-2 text-center">Ý Định Tìm Kiếm</div>
              <div className="col-span-2 text-center">Độ Khó / Volume</div>
              <div className="col-span-1">Phân Tích</div>
            </div>

            {filtered.map((opp, idx) => (
              <div key={idx} className={cn('grid grid-cols-12 gap-3 px-5 py-3.5 items-start hover:bg-gray-50 transition-colors',
                selected.has(opp.keyword) && 'bg-brand-50/50')}>
                <div className="col-span-1 flex items-center justify-center pt-0.5">
                  <input type="checkbox" checked={selected.has(opp.keyword)} onChange={() => toggleSelect(opp.keyword)}
                    className="accent-brand-600 w-4 h-4" />
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{opp.keyword}</p>
                  <p className="text-[10px] text-brand-600 mt-0.5 leading-tight">Suggested: "{opp.suggestedTitle.slice(0, 50)}..."</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', TYPE_STYLE[opp.type])}>{TYPE_LABEL[opp.type] || opp.type}</span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', INTENT_STYLE[opp.intent])}>{INTENT_LABEL[opp.intent] || opp.intent}</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', kdColor(opp.kd))}>KD {opp.kd} · {opp.kdLabel}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{opp.volume}</p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Link
                    href={`/dashboard/content/new?keyword=${encodeURIComponent(opp.keyword)}&title=${encodeURIComponent(opp.suggestedTitle)}`}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                    title={opp.rationale}
                  >
                    <PenSquare className="w-3.5 h-3.5" /> Viết bài
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Brain className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Nhấn "Tìm Cơ Hội AI" để quét cơ hội</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
