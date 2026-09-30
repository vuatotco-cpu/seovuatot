'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Brain, Copy, Download, Globe, Loader2, Save, Sparkles,
  Zap, ToggleLeft, ToggleRight, RefreshCw, CheckCircle, XCircle,
  PenSquare, TrendingUp, Target, ArrowRight, ChevronDown, Image
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Mode = 'deep-dive' | 'news-trend' | 'competitor'

const MODES: { key: Mode; label: string; sub: string; desc: string; badge: string }[] = [
  { key: 'deep-dive', label: 'Từ Khóa Chuyên Sâu', sub: 'Chuẩn Top 1 Google', badge: 'CHẾ ĐỘ 1', desc: 'Bao phủ toàn bộ ý định tìm kiếm, cấu trúc E-E-A-T và FAQ schema chuẩn.' },
  { key: 'news-trend', label: 'Bắt Sóng Xu Hướng Mới', sub: 'Viral trong 24 giờ', badge: 'CHẾ ĐỘ 2', desc: 'Phân tích sự kiện nóng kết hợp từ khóa dài để thu hút traffic nhanh.' },
  { key: 'competitor', label: 'So Sánh Đối Thủ', sub: 'Ý định chuyển đổi cao', badge: 'CHẾ ĐỘ 3', desc: 'Tự xây dựng bảng so sánh A với B, tối ưu chuyển đổi và CTA mạnh.' },
]

const WORD_COUNTS = [
  { value: '800', label: '~800 từ (~4,000 credits)' },
  { value: '1200', label: '~1,200 từ (~6,000 credits)' },
  { value: '1500', label: '~1,500 từ (~8,000 credits)' },
  { value: '2500', label: '~2,500 từ (~12,500 credits)' },
  { value: '3000', label: '~3,000 từ (~15,000 credits)' },
]

const IMAGE_CONFIGS = [
  { value: '0', label: 'Không tạo ảnh' },
  { value: '1', label: '1 Ảnh Featured (~5,000 credits)' },
  { value: '2', label: '1 Featured + 1 In-content (~10,000 credits)' },
  { value: '3', label: '1 Featured + 2 In-content (~15,000 credits)' },
]

function NewContentForm() {
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get('mode') as Mode) || 'deep-dive'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [wordCount, setWordCount] = useState('1500')
  const [imageCount, setImageCount] = useState('1')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [outline, setOutline] = useState('')
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Autopilot options
  const [autopilot, setAutopilot] = useState({
    publishCms: false,
    googleIndex: false,
    socialShare: false,
    internalLinks: true,
    backlinks: false,
  })

  const handleGenerate = async () => {
    if (!keyword.trim()) { toast.error('Vui lòng nhập từ khóa'); return }

    setGenerating(true)
    setContent('')

    const systemPrompt = mode === 'deep-dive'
      ? `Bạn là chuyên gia SEO E-E-A-T. Viết bài chuẩn Google Top 1 với TOC, Key Takeaways, FAQ Schema.`
      : mode === 'news-trend'
      ? `Bạn là editor tin tức SEO. Viết bài đánh đúng xu hướng trending với góc nhìn độc đáo.`
      : `Bạn là chuyên gia so sánh sản phẩm. Viết bài so sánh A vs B chuẩn Conversion Intent.`

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          title: title || keyword,
          intent: mode === 'news-trend' ? 'Informational' : mode === 'competitor' ? 'Commercial' : 'Informational',
          wordCount: parseInt(wordCount),
          systemPrompt,
          outline,
        }),
      })

      if (!res.ok) throw new Error('API error')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setContent(prev => prev + decoder.decode(value))
        }
      }
      toast.success('Viết bài xong!')
    } catch {
      toast.error('Lỗi khi viết bài. Kiểm tra API key.')
    }
    setGenerating(false)
  }

  const handleSave = async () => {
    if (!content) return
    setSaving(true)
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || keyword, keyword, content, status: 'pending_review' }),
      })
      if (res.ok) toast.success('Đã lưu vào database!')
      else toast.info('Lưu thất bại — cấu hình Supabase để lưu bài')
    } catch { toast.info('Chưa kết nối Supabase') }
    setSaving(false)
  }

  const handlePublish = async () => {
    if (!content) return
    const config = JSON.parse(localStorage.getItem('website_publish_config') || '{}')
    if (!config.adminUrl || !config.username) {
      toast.error('Chưa cấu hình website. Vào Cài đặt → Xuất Bản CMS')
      return
    }
    setPublishing(true)
    try {
      const res = await fetch('/api/publish/laravel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: { title: title || keyword, content, keyword }, config }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`✅ Đã đăng lên ${data.selectedCategory || 'website'}!`)
        if (data.postUrl) window.open(data.postUrl, '_blank')
      } else {
        toast.error(data.error || 'Đăng bài thất bại')
      }
    } catch { toast.error('Không kết nối được website') }
    setPublishing(false)
  }

  const estimatedContentCredits = Math.round(parseInt(wordCount) * 5)
  const estimatedImageCredits = parseInt(imageCount) * 5000
  const estimatedTotal = estimatedContentCredits + estimatedImageCredits

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)}
      className={cn('relative w-10 h-5 rounded-full transition-colors flex-shrink-0', checked ? 'bg-brand-600' : 'bg-gray-200')}>
      <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  )

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Tạo Bài Viết SEO & GEO Tối Ưu 2026</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI tự động nghiên cứu thực thể, trích xuất heading, tối ưu E-E-A-T và render hình ảnh phù hợp.</p>
        </div>

        <div className="p-6 space-y-5 max-w-3xl">

          {/* Step 1: Website */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">1. Chọn Website Mục Tiêu</p>
            <div className="flex items-center gap-3 p-3 border border-brand-200 bg-brand-50 rounded-lg">
              <Globe className="w-5 h-5 text-brand-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">vuatot.vn</p>
                <p className="text-xs text-gray-500">Ngôn ngữ bài viết: Tiếng Việt (được đặt theo website này)</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Đã kết nối</span>
            </div>
          </div>

          {/* Step 2: Writing Mode */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">2. Chọn Chế Độ Viết Bài</p>
            <div className="grid grid-cols-3 gap-3">
              {MODES.map(m => (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className={cn('text-left p-4 rounded-xl border-2 transition-all',
                    mode === m.key ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'
                  )}>
                  <p className="text-[10px] font-bold text-gray-400 mb-1">{m.badge}</p>
                  <p className={cn('text-sm font-semibold mb-0.5', mode === m.key ? 'text-brand-700' : 'text-gray-900')}>{m.label}</p>
                  <p className="text-xs text-gray-500">{m.sub}</p>
                  {mode === m.key && <p className="text-xs text-brand-600 mt-2 leading-relaxed">{m.desc}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Input */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">3. Nhập Chi Tiết & Cấu Hình Ảnh AI</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Từ Khóa Trọng Tâm *</label>
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="vd: mua điện thoại cũ uy tín, cách chọn laptop cũ..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tiêu đề bài (để trống AI sẽ tự tạo)</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="vd: Hướng dẫn mua điện thoại cũ uy tín tại Vua Tốt 2026"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Độ dài bài viết mục tiêu</label>
                  <select value={wordCount} onChange={e => setWordCount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    {WORD_COUNTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1"><Image className="w-3 h-3" /> Cấu hình ảnh AI</label>
                  <select value={imageCount} onChange={e => setImageCount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    {IMAGE_CONFIGS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Advanced options */}
              <button onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700">
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', advancedOpen && 'rotate-180')} />
                Tùy chọn nâng cao (Custom title & outline notes)
              </button>
              {advancedOpen && (
                <textarea
                  value={outline}
                  onChange={e => setOutline(e.target.value)}
                  placeholder="Nhập outline tùy chỉnh hoặc ghi chú cho AI..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !keyword.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {generating ? 'AI đang viết bài...' : `Tạo Bài Viết AI Ngay (~${estimatedTotal.toLocaleString()} credits)`}
            {!generating && <ArrowRight className="w-4 h-4" />}
          </button>

          {/* Generated Content */}
          {content && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Nội dung đã tạo
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(content); toast.success('Đã copy!') }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded-lg">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-200">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Lưu
                  </button>
                  <button onClick={handlePublish} disabled={publishing}
                    className="flex items-center gap-1 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700">
                    {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    {publishing ? 'Đang đăng...' : 'Đăng lên website'}
                  </button>
                </div>
              </div>
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">{content}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar: Autopilot */}
      <div className="w-72 border-l border-gray-100 bg-white overflow-y-auto flex-shrink-0">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">CÀI ĐẶT TỰ ĐỘNG</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              Tất cả
              <Toggle
                checked={Object.values(autopilot).some(v => v)}
                onChange={v => setAutopilot({ publishCms: v, googleIndex: v, socialShare: v, internalLinks: v, backlinks: false })}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-5">Cấu hình các bước tự động sau khi tạo bài viết:</p>

          <div className="space-y-4">
            {/* 1. Đăng lên CMS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700">1. Đăng Lên Website</p>
                </div>
                <Toggle checked={autopilot.publishCms} onChange={v => setAutopilot(p => ({...p, publishCms: v}))} />
              </div>
              <p className="text-[10px] text-gray-400 pl-6">Laravel + Tự chọn danh mục + Upload ảnh</p>
              <div className={cn('flex items-center gap-1.5 pl-6 text-[10px]', autopilot.publishCms ? 'text-green-600' : 'text-orange-500')}>
                {autopilot.publishCms ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {autopilot.publishCms ? 'Đã kết nối' : 'Chưa kết nối —'}
                {!autopilot.publishCms && <a href="/dashboard/settings" className="underline hover:text-orange-700 ml-0.5">Cài đặt ngay</a>}
              </div>
            </div>

            <div className="border-t border-gray-50" />

            {/* 2. Google Index */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700">2. Google Indexing</p>
                </div>
                <Toggle checked={autopilot.googleIndex} onChange={v => setAutopilot(p => ({...p, googleIndex: v}))} />
              </div>
              <p className="text-[10px] text-gray-400 pl-6">Ping Google trong 24 giờ</p>
              <div className={cn('flex items-center gap-1.5 pl-6 text-[10px]', autopilot.googleIndex ? 'text-green-600' : 'text-orange-500')}>
                {autopilot.googleIndex ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {autopilot.googleIndex ? 'Đã cấu hình' : 'Chưa có key Indexing —'}
                {!autopilot.googleIndex && <a href="/dashboard/settings" className="underline hover:text-orange-700 ml-0.5">Cài đặt</a>}
              </div>
            </div>

            <div className="border-t border-gray-50" />

            {/* 3. Mạng xã hội */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700">3. Đăng Mạng Xã Hội</p>
                </div>
                <Toggle checked={autopilot.socialShare} onChange={v => setAutopilot(p => ({...p, socialShare: v}))} />
              </div>
              <p className="text-[10px] text-gray-400 pl-6">Facebook, Threads, LinkedIn</p>
              <p className="text-[10px] text-orange-500 pl-6">Chưa kết nối kênh mạng xã hội</p>
            </div>

            <div className="border-t border-gray-50" />

            {/* 4. Link nội bộ */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-500" />
                  <p className="text-xs font-semibold text-gray-700">4. Chèn Link Nội Bộ</p>
                </div>
                <Toggle checked={autopilot.internalLinks} onChange={v => setAutopilot(p => ({...p, internalLinks: v}))} />
              </div>
              <p className="text-[10px] text-gray-400 pl-6">Tự động theo cụm chủ đề</p>
              <p className="text-[10px] text-green-600 pl-6 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Bật — tự động chèn link nội bộ</p>
            </div>

            <div className="border-t border-gray-50" />

            {/* 5. Backlink */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-700">5. Trao Đổi Backlink</p>
                </div>
                <Toggle checked={autopilot.backlinks} onChange={v => setAutopilot(p => ({...p, backlinks: v}))} />
              </div>
              <p className="text-[10px] text-gray-400 pl-6">Mạng lưới website liên kết</p>
              <p className="text-[10px] text-gray-400 pl-6">Mạng lưới chưa kích hoạt</p>
            </div>
          </div>

          {/* Ước tính */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ước Tính Tài Nguyên AI</p>
              <span className="text-xs text-gray-400">1 bài viết</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tạo nội dung:</span>
                <span className="font-medium">~{estimatedContentCredits.toLocaleString()} tokens</span>
              </div>
              {parseInt(imageCount) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Hình ảnh AI ({imageCount} ảnh):</span>
                  <span className="font-medium">+{estimatedImageCredits.toLocaleString()} tokens</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Tổng ước tính:</span>
                <span>~{estimatedTotal.toLocaleString()} tokens</span>
              </div>
              <p className="text-[10px] text-gray-400">Dùng AI của bạn (Claude/Gemini) — miễn phí hoàn toàn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewArticlePage() {
  return (
    <div className="h-full flex flex-col">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      }>
        <NewContentForm />
      </Suspense>
    </div>
  )
}
