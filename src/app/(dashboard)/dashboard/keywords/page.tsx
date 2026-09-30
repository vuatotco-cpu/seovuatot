'use client'

import { useState } from 'react'
import { Search, Loader2, TrendingUp, Zap, Brain, BarChart3, Download, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface KeywordResult {
  keyword: string
  volume: number
  kd: number
  cpc: number
  intent: string
  difficulty_label: string
  opportunity_score: number
  estimated_volume?: string
  title?: string
}

const INTENT_COLOR: Record<string, string> = {
  Informational: 'bg-blue-50 text-blue-700',
  Commercial: 'bg-purple-50 text-purple-700',
  Transactional: 'bg-green-50 text-green-700',
  Navigational: 'bg-gray-50 text-gray-600',
}

const NICHES = [
  'điện thoại cũ', 'laptop cũ', 'xe máy cũ', 'đồ gia dụng cũ',
  'quần áo cũ', 'sách cũ', 'nội thất cũ', 'máy tính bảng cũ',
]

export default function KeywordsPage() {
  const [seed, setSeed] = useState('')
  const [mode, setMode] = useState<'related' | 'ai_suggest'>('related')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<KeywordResult[]>([])
  const [source, setSource] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSelect = (kw: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(kw) ? n.delete(kw) : n.add(kw); return n })

  const handleExportCSV = () => {
    if (!results.length) { toast.error('Chưa có kết quả để xuất'); return }
    const rows = [
      ['Từ khóa', 'Volume', 'KD', 'Intent', 'CPC', 'Difficulty', 'Opportunity Score'],
      ...results.map(r => [r.keyword, r.volume ?? '', r.kd ?? '', r.intent, r.cpc ?? '', r.difficulty_label ?? '', r.opportunity_score ?? '']),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `keywords-${seed}-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Đã xuất ${results.length} từ khóa`)
  }

  const handleSearch = async (keyword = seed) => {
    if (!keyword.trim()) { toast.error('Nhập từ khóa seed để tìm kiếm'); return }
    setSeed(keyword)
    setLoading(true)
    try {
      const res = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, mode }),
      })
      const data = await res.json()
      if (data.keywords) {
        setResults(data.keywords)
        setSource(data.source)
        toast.success(`Tìm được ${data.keywords.length} từ khóa`)
      } else {
        toast.error(data.error || 'Lỗi khi tìm kiếm')
      }
    } catch {
      toast.error('Không kết nối được server')
    }
    setLoading(false)
  }

  const kdColor = (kd: number) =>
    kd <= 15 ? 'text-green-700 bg-green-50' : kd <= 30 ? 'text-yellow-700 bg-yellow-50' : kd <= 50 ? 'text-orange-700 bg-orange-50' : 'text-red-700 bg-red-50'

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="w-6 h-6 text-brand-600" /> Nghiên cứu từ khóa
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Tìm từ khóa tiềm năng với dữ liệu volume, KD thật từ DataForSEO</p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={seed}
              onChange={e => setSeed(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập từ khóa seed... VD: điện thoại cũ"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setMode('related')}
              className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors', mode === 'related' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50')}
            >
              <BarChart3 className="w-4 h-4 inline mr-1.5" />DataForSEO
            </button>
            <button
              onClick={() => setMode('ai_suggest')}
              className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors', mode === 'ai_suggest' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50')}
            >
              <Brain className="w-4 h-4 inline mr-1.5" />AI gợi ý
            </button>
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Tìm kiếm
          </button>
        </div>

        {/* Quick niches */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 py-1">Gợi ý:</span>
          {NICHES.map(n => (
            <button key={n} onClick={() => handleSearch(n)}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-brand-50 hover:text-brand-600 transition-colors">
              {n}
            </button>
          ))}
        </div>

        {source && (
          <p className="text-xs text-gray-400 mt-3">
            Nguồn dữ liệu: {source === 'dataforseo' ? '✅ DataForSEO (dữ liệu thật)' : source === 'ai' ? '🤖 AI gợi ý' : '⚡ Ước tính (cần DataForSEO key)'}
          </p>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">{results.length} từ khóa</span>
              {selected.size > 0 && (
                <Link
                  href={`/dashboard/content/new?keyword=${encodeURIComponent(Array.from(selected)[0])}`}
                  className="flex items-center gap-1 text-xs bg-brand-600 text-white px-2.5 py-1 rounded-lg hover:bg-brand-700">
                  <Zap className="w-3 h-3" /> Viết {selected.size} bài đã chọn
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(new Set(results.map(r => r.keyword)))}
                className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                <CheckSquare className="w-3 h-3" /> Chọn tất cả
              </button>
              <button onClick={handleExportCSV}
                className="flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                <Download className="w-3 h-3" /> Xuất CSV
              </button>
            </div>
          </div>
          <div className="grid grid-cols-12 w-full text-xs font-semibold text-gray-500 uppercase tracking-wider gap-2 px-5 py-2 border-b border-gray-50">
            <div className="col-span-1" />
            <div className="col-span-3">Từ khóa</div>
            <div className="col-span-2 text-center">Volume/tháng</div>
            <div className="col-span-1 text-center">KD</div>
            <div className="col-span-2 text-center">Intent</div>
            <div className="col-span-1 text-center">CPC</div>
            <div className="col-span-2 text-right">Thao tác</div>
          </div>

          <div className="divide-y divide-gray-50">
            {results.map((kw, idx) => (
              <div key={idx} className={cn('grid grid-cols-12 items-center gap-2 px-5 py-3.5 hover:bg-gray-50/50 transition-colors', selected.has(kw.keyword) && 'bg-brand-50/50')}>
                <div className="col-span-1 flex items-center">
                  <input type="checkbox" checked={selected.has(kw.keyword)} onChange={() => toggleSelect(kw.keyword)} className="accent-brand-600 w-4 h-4" />
                </div>
                <div className="col-span-3">
                  <p className="text-sm font-medium text-gray-900">{kw.keyword}</p>
                  {kw.title && <p className="text-xs text-gray-400 truncate mt-0.5">{kw.title}</p>}
                  {kw.difficulty_label && (
                    <span className="text-xs text-gray-500">{kw.difficulty_label}</span>
                  )}
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-semibold text-gray-900">
                    {kw.estimated_volume || (kw.volume > 0 ? kw.volume.toLocaleString() : '—')}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <span className={cn('text-xs px-2 py-1 rounded-lg font-medium', kdColor(kw.kd || 0))}>
                    {kw.kd || '—'}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', INTENT_COLOR[kw.intent] || 'bg-gray-50 text-gray-600')}>
                    {kw.intent}
                  </span>
                </div>
                <div className="col-span-1 text-center text-xs text-gray-500">
                  {kw.cpc ? `$${kw.cpc.toFixed(2)}` : '—'}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/content/new?keyword=${encodeURIComponent(kw.keyword)}&title=${encodeURIComponent(kw.title || kw.keyword)}`}
                    className="text-xs bg-brand-50 text-brand-600 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100 flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Viết bài
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Nhập từ khóa seed và nhấn Tìm kiếm</p>
          <p className="text-xs text-gray-400 mt-1">
            DataForSEO: volume & KD thật • AI: gợi ý từ khóa phù hợp niche
          </p>
        </div>
      )}
    </div>
  )
}
