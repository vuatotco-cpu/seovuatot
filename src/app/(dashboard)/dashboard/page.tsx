'use client'

import { Brain, FileText, Globe, PenSquare, Search, Sparkles, Zap, TrendingUp, ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardData {
  profile: {
    credits: number
    points: number
    planId: string
    fullName: string
  }
  sites: Array<{ id: string; domain: string; name: string; niche: string; gscConnected: boolean; cmsType: string }>
  metrics: {
    totalArticles: number
    publishedArticles: number
    totalWords: number
    gsc30d: { impressions: number; clicks: number; avgCtr: number; avgPosition: number }
    breakthroughCount: number
    totalSites: number
  }
  recentArticles: Array<{
    id: string; title: string; keyword: string; wordCount: number
    status: string; createdAt: string; publishedAt: string | null
  }>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  published:      { label: 'Đã đăng',    color: 'bg-green-100 text-green-700' },
  draft:          { label: 'Nháp',        color: 'bg-gray-100 text-gray-500' },
  pending_review: { label: 'Chờ duyệt',  color: 'bg-yellow-100 text-yellow-700' },
  scheduled:      { label: 'Lên lịch',   color: 'bg-blue-100 text-blue-700' },
}

function fmtNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

const writingModes = [
  { mode: 1, label: 'Từ Khóa Chuyên Sâu',    sub: 'Chuẩn SEO Top 1 Google',     href: '/dashboard/content/new?mode=deep-dive' },
  { mode: 2, label: 'Bắt Sóng Xu Hướng Mới', sub: 'Viral trong 24 giờ',         href: '/dashboard/content/new?mode=news-trend' },
  { mode: 3, label: 'So Sánh Đối Thủ',        sub: 'Ý định chuyển đổi cao',     href: '/dashboard/content/new?mode=competitor' },
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const m = data?.metrics
  const primaryDomain = data?.sites?.[0]?.domain ?? 'website'

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Trung Tâm Điều Hành SEO & AI Automation</h1>
          <p className="text-xs text-gray-400 mt-0.5">Hiệu suất tổng hợp của toàn bộ các website đã kết nối</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            {loading ? 'Đang tải...' : `Tất cả website (${m?.totalSites ?? 0})`}
          </span>
          <Link href="/dashboard/content/new" className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors">
            <PenSquare className="w-4 h-4" /> Tạo Bài Viết Mới
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-6xl mx-auto">

        {/* SEO Authority Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Chỉ Số Uy Tín & Sức Mạnh SEO Toàn Bộ Website</p>
              <p className="text-xs text-gray-400">Chỉ số tổng hợp bài viết, từ khóa và tiến độ xuất bản.</p>
            </div>
            <Link href="/dashboard/websites" className="ml-auto text-xs text-brand-600 hover:underline">
              Tất cả ({m?.totalSites ?? 0}) →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Bài Viết AI Đã Tạo',    value: fmtNumber(m?.totalArticles ?? 0),    sub: `${fmtNumber(m?.totalWords ?? 0)} từ đã viết` },
                { label: 'Bài Viết Đã Xuất Bản',  value: fmtNumber(m?.publishedArticles ?? 0), sub: 'Đang live trên website' },
                { label: 'CƠ HỘI BỨT PHÁ',        value: fmtNumber(m?.breakthroughCount ?? 0), sub: 'KD < 30 — sắp vào Top 3' },
                { label: 'Website Đã Kết Nối',     value: fmtNumber(m?.totalSites ?? 0),        sub: 'Quản lý trong hệ thống' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 leading-tight mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GSC Growth Engine */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Hiệu Suất Tăng Trưởng Google (30 Ngày)</p>
                <p className="text-xs text-gray-400">
                  {data?.sites?.some(s => s.gscConnected)
                    ? 'Dữ liệu từ Google Search Console'
                    : 'Kết nối Google Search Console để xem dữ liệu thực tế'}
                </p>
              </div>
            </div>
            <Link href="/dashboard/ai-radar" className="text-xs text-brand-600 flex items-center gap-1 hover:underline font-medium">
              Khám Phá Radar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Tổng Lượt Hiển Thị (30 ngày)', value: fmtNumber(m?.gsc30d.impressions ?? 0), sub: 'Impressions từ GSC', color: 'text-blue-600' },
                { label: 'Tổng Lượt Click Thực Tế',       value: fmtNumber(m?.gsc30d.clicks ?? 0),      sub: `CTR: ${m?.gsc30d.avgCtr ? (m.gsc30d.avgCtr * 100).toFixed(1) : 0}%`, color: 'text-green-600' },
                { label: 'CƠ HỘI BỨT PHÁ',                value: fmtNumber(m?.breakthroughCount ?? 0),  sub: 'Từ khóa sắp vào Top 3', color: 'text-orange-600' },
                { label: 'Tổng Bài Đã Tạo',               value: fmtNumber(m?.totalArticles ?? 0),      sub: `${fmtNumber(m?.totalWords ?? 0)} từ AI đã tạo`, color: 'text-purple-600' },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2 leading-tight">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">{s.sub}</p>
                </div>
              ))}
            </div>
          )}

          {!data?.sites?.some(s => s.gscConnected) && !loading && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
              <p className="text-xs text-blue-700">Kết nối Google Search Console để xem clicks, impressions và từ khóa thực tế.</p>
              <Link href="/dashboard/google-console" className="text-xs font-semibold text-blue-700 hover:underline flex-shrink-0">Kết nối ngay →</Link>
            </div>
          )}
        </div>

        {/* What To Do Today */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  Việc Nên Làm Hôm Nay
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">+8 điểm tiềm năng</span>
                </p>
                <p className="text-xs text-gray-400">Thực hiện các hành động đề xuất dưới đây để gia tăng Authority.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { pts: '+4 pts', tag: 'AI RADAR', title: 'Mở AI Market Radar', desc: 'Tìm khoảng trống nội dung, từ khóa cao ROI, xu hướng 2026.', href: '/dashboard/ai-radar', btn: 'Mở AI Market Radar' },
              { pts: '+4 pts', tag: 'NỘI DUNG', title: 'Biến Cơ Hội Thành Bài Viết', desc: 'Chọn từ khóa cao ROI và tạo bài viết tập trung cho website.', href: '/dashboard/content/new', btn: 'Viết Bài Ngay' },
            ].map((action, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-brand-200 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{action.pts}</span>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider">{action.tag}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{action.title}</p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{action.desc}</p>
                <Link href={action.href} className="flex items-center justify-between w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors group">
                  {action.btn}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* AI Article Launchpad */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Bệ Phóng Tạo Bài Viết AI</p>
                <p className="text-xs text-gray-400">Chọn 1 trong 3 chế độ viết bài chuyên sâu</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {writingModes.map((m) => (
                <Link key={m.mode} href={m.href}
                  className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:border-brand-200 hover:bg-brand-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-400">MODE {m.mode}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.sub}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
                </Link>
              ))}
            </div>
            <Link href="/dashboard/content/new"
              className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:border-brand-300 hover:text-brand-600 transition-colors">
              + Tạo bài tùy chỉnh
            </Link>
          </div>

          {/* Recent Articles */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Bài Viết Gần Đây</p>
                  <p className="text-xs text-gray-400">Các bài viết mới nhất được tạo bởi AI Engine.</p>
                </div>
              </div>
              <Link href="/dashboard/content" className="text-xs text-brand-600 hover:underline font-medium">Xem Tất Cả →</Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
            ) : (data?.recentArticles?.length ?? 0) === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chưa có bài viết nào</p>
                <Link href="/dashboard/content/new" className="text-xs text-brand-600 hover:underline mt-1 inline-block">Tạo bài đầu tiên →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.recentArticles ?? []).map((a, i) => {
                  const st = STATUS_LABELS[a.status] ?? { label: a.status, color: 'bg-gray-100 text-gray-500' }
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-bold text-gray-300 w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug">{a.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{primaryDomain} • {a.wordCount.toLocaleString()} từ</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${st.color}`}>{st.label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <Link href="/dashboard/content" className="flex items-center justify-center gap-1 w-full mt-3 text-xs text-gray-500 hover:text-brand-600 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Xem tất cả bài viết <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Automation Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Lịch Tự Động Hóa Hàng Ngày</p>
              <p className="text-xs text-gray-400">AI chạy tự động mỗi ngày lúc 7:00 sáng</p>
            </div>
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Đang hoạt động
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Search,    label: 'Quét từ khóa',   time: '07:00', done: true },
              { icon: Brain,     label: 'AI viết bài',     time: '07:15', done: true },
              { icon: FileText,  label: 'Tạo ảnh AI',      time: '07:45', done: true },
              { icon: Globe,     label: 'Ping Google Index', time: '08:00', done: false },
            ].map((step, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${step.done ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                <step.icon className={`w-4 h-4 flex-shrink-0 ${step.done ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="text-xs font-medium text-gray-900">{step.label}</p>
                  <p className="text-[10px] text-gray-400">{step.time}</p>
                </div>
                {step.done ? <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" /> : <Clock className="w-3.5 h-3.5 text-gray-300 ml-auto" />}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
