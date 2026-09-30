import { Brain, FileText, Globe, PenSquare, Search, Sparkles, ThumbsUp, Zap, TrendingUp, ArrowRight, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const recentArticles = [
  { id: 1, title: 'Kinh nghiệm kiểm tra xe máy cũ trước khi ký hợp đồng trả góp không thể bỏ qua', site: 'vuatot.vn', words: '1,021', status: 'Thất bại', statusColor: 'bg-red-100 text-red-600' },
  { id: 2, title: 'Huy hiệu vương miện người bán Vua Tốt: Cơ chế & lợi ích', site: 'vuatot.vn', words: '1,000', status: 'Sẵn sàng', statusColor: 'bg-green-100 text-green-700' },
  { id: 3, title: 'Cách nhận biết người bán uy tín trên Vua Tốt', site: 'vuatot.vn', words: '1,021', status: 'Sẵn sàng', statusColor: 'bg-green-100 text-green-700' },
  { id: 4, title: 'Hướng dẫn thủ tục sang tên xe máy cũ chi tiết 2026', site: 'vuatot.vn', words: '1,801', status: 'Sẵn sàng', statusColor: 'bg-green-100 text-green-700' },
]

const writingModes = [
  { mode: 1, label: 'Từ Khóa Chuyên Sâu', sub: 'Chuẩn SEO Top 1 Google', href: '/dashboard/content/new?mode=deep-dive' },
  { mode: 2, label: 'Bắt Sóng Xu Hướng Mới', sub: 'Viral trong 24 giờ', href: '/dashboard/content/new?mode=news-trend' },
  { mode: 3, label: 'So Sánh Đối Thủ', sub: 'Ý định chuyển đổi cao', href: '/dashboard/content/new?mode=competitor' },
]

const todoActions = [
  {
    pts: '+4 pts', tag: 'AI RADAR', title: 'Mở AI Market Radar',
    desc: 'Tìm khoảng trống nội dung, từ khóa có ROI cao, xu hướng 2026 ngoài dữ liệu Google Search Console hiện có.',
    href: '/dashboard/ai-radar', btnLabel: 'Mở AI Market Radar',
  },
  {
    pts: '+4 pts', tag: 'NỘI DUNG', title: 'Biến Cơ Hội Thành Bài Viết',
    desc: 'Sau khi chọn từ khóa cao ROI, tạo bài viết tập trung cho website đang quản lý.',
    href: '/dashboard/content/new', btnLabel: 'Viết Bài Ngay',
  },
]

export default function DashboardPage() {
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
            <Globe className="w-3.5 h-3.5" /> Tất cả website (1)
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
              <p className="text-xs text-gray-400">Chỉ số tổng hợp Ahrefs DR, Moz authority và tiến độ xuất bản của toàn bộ website.</p>
            </div>
            <Link href="/dashboard/websites" className="ml-auto text-xs text-brand-600 hover:underline">Tất cả (1) →</Link>
          </div>
          <div className="grid grid-cols-5 gap-4 items-center">
            {/* Authority Gauge */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12"/>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#2563eb" strokeWidth="12"
                    strokeDasharray={`${57 * 3.14} ${314}`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">57</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mt-2 font-medium">Đang tăng trưởng</span>
              <p className="text-xs text-gray-500 text-center mt-1">Sức mạnh SEO tổng hợp từ toàn bộ 1 website đang quản lý.</p>
            </div>
            {/* Stats Grid */}
            <div className="col-span-4 grid grid-cols-4 gap-3">
              {[
                { label: 'Điểm Ahrefs DR', value: '0', sub: '/100 Điểm domain theo Ahrefs', badge: 'Chính thức' },
                { label: 'Điểm Crawl Trung Bình', value: '35', sub: '/100 Chỉ số sức mạnh liên kết', badge: 'Trực tiếp' },
                { label: 'Nguy Cơ Spam Score', value: '5%', sub: 'Rất thấp - An toàn', badge: 'An toàn' },
                { label: 'Tỷ Lệ Google Index', value: '85%', sub: '1 website đang theo dõi', badge: null },
                { label: 'Tên Miền Liên Kết', value: '0', sub: 'Tổng host trong mạng lưới', badge: null },
                { label: 'Tổng Backlinks', value: '0', sub: 'Tổng liên kết toàn danh mục', badge: null },
                { label: 'Bài AI Đã Xuất Bản', value: '4', sub: '3,822 từ AI đã tạo', badge: null },
                { label: 'CƠ HỘI BỨT PHÁ', value: '0', sub: 'Từ khóa sắp vào Top 3', badge: null },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
                    {s.badge && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded">{s.badge}</span>}
                  </div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GSC Growth Engine */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Hiệu Suất Tăng Trưởng Google Thực Tế</p>
                <p className="text-xs text-gray-400">Kết nối Google Search Console để xem dữ liệu tìm kiếm thực tế.</p>
              </div>
            </div>
            <Link href="/dashboard/ai-radar" className="text-xs text-brand-600 flex items-center gap-1 hover:underline font-medium">
              Khám Phá Radar Chi Tiết <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tổng Lượt Hiển Thị (30 ngày)', value: '0', sub: 'Kết nối GSC để đo lường', color: 'text-blue-600' },
              { label: 'Tổng Lượt Click Thực Tế', value: '0', sub: 'Tỷ lệ click trung bình: 0%', color: 'text-green-600' },
              { label: 'CƠ HỘI BỨT PHÁ', value: '0', sub: 'Từ khóa sắp vào Top 3', color: 'text-orange-600' },
              { label: 'Tổng Bài Đã Xuất Bản', value: '4', sub: '3,822 từ AI đã tạo', color: 'text-purple-600' },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-2 leading-tight">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <p className="text-xs text-blue-700">Kết nối Google Search Console để xem dữ liệu clicks, impressions và từ khóa thực tế.</p>
            <Link href="/dashboard/google-console" className="text-xs font-semibold text-blue-700 hover:underline flex-shrink-0">Kết nối ngay →</Link>
          </div>
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
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Có thể tăng +8 điểm</span>
                </p>
                <p className="text-xs text-gray-400">Thực hiện các hành động đề xuất dưới đây để trực tiếp gia tăng điểm số Authority toàn mạng lưới.</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">Ưu tiên theo tác động</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {todoActions.map((action, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-brand-200 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{action.pts}</span>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider">{action.tag}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{action.title}</p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{action.desc}</p>
                <Link href={action.href}
                  className="flex items-center justify-between w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors group">
                  {action.btnLabel}
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
            <div className="space-y-2">
              {recentArticles.map((a, i) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-bold text-gray-300 w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug">{a.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{a.site} • {a.words} từ • Tập trung từ khóa</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${a.statusColor}`}>{a.status}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/content"
              className="flex items-center justify-center gap-1 w-full mt-3 text-xs text-gray-500 hover:text-brand-600 py-2 rounded-lg hover:bg-gray-50 transition-colors">
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
              { icon: Search, label: 'Quét từ khóa', time: '07:00', done: true },
              { icon: Brain, label: 'AI viết 3 bài', time: '07:15', done: true },
              { icon: FileText, label: 'Tạo ảnh AI', time: '07:45', done: true },
              { icon: Globe, label: 'Ping Google Index', time: '08:00', done: false },
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
