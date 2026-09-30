'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Edit3, Eye, Globe, Image, Loader2, Play, RefreshCw, ThumbsUp, Trash2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PendingArticle {
  id: string
  keyword: string
  title: string
  content: string
  word_count: number
  intent: string
  reason: string
  generated_at: string
  status: 'pending_review' | 'approved' | 'rejected' | 'editing'
  image_url?: string
  image_source?: 'dalle' | 'unsplash' | 'placeholder'
  image_alt?: string
  image_credit?: string
}

// Mock data - thực tế sẽ lấy từ Supabase
const MOCK_ARTICLES: PendingArticle[] = [
  {
    id: '1',
    keyword: 'cách chọn điện thoại cũ chất lượng',
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    image_source: 'unsplash',
    image_alt: 'Điện thoại cũ chất lượng',
    title: 'Hướng dẫn chọn điện thoại cũ chất lượng năm 2026',
    content: `# Hướng dẫn chọn điện thoại cũ chất lượng năm 2026

## Giới thiệu

Mua điện thoại cũ là lựa chọn thông minh giúp tiết kiệm 30-50% so với máy mới...

## 5 Tiêu chí quan trọng khi chọn điện thoại cũ

### 1. Kiểm tra pin và dung lượng
Pin là bộ phận hao mòn nhanh nhất. Hãy yêu cầu người bán cho xem thông tin dung lượng pin thực tế...

### 2. Kiểm tra màn hình
- Không có điểm chết, sọc dọc
- Cảm ứng hoạt động mượt mà
- Độ sáng đều trên toàn màn hình

### 3. Kiểm tra camera
Chụp vài bức ảnh trong điều kiện ánh sáng khác nhau...

### 4. Kiểm tra kết nối
WiFi, 4G/5G, Bluetooth, NFC (nếu có)...

### 5. Kiểm tra lịch sử máy
Yêu cầu người bán cung cấp thông tin nguồn gốc máy...

## FAQ

**Mua điện thoại cũ ở đâu uy tín?**
Nên mua tại các nền tảng có hệ thống đánh giá người bán minh bạch...

**Có nên mua điện thoại cũ không?**
Hoàn toàn nên nếu bạn biết cách kiểm tra kỹ...

**Điện thoại cũ có bảo hành không?**
Tùy người bán, thường 1-3 tháng...

## Kết luận

Tìm mua điện thoại cũ chất lượng ngay tại Vua Tốt với hàng nghìn tin rao uy tín!`,
    word_count: 1523,
    intent: 'Informational',
    reason: 'Từ khóa KD thấp (8), lượng tìm kiếm 2,400/tháng, đối thủ chưa có bài chi tiết',
    generated_at: new Date().toISOString(),
    status: 'pending_review',
  },
  {
    id: '2',
    keyword: 'bán laptop cũ giá cao nhất',
    title: 'Bí quyết bán laptop cũ được giá cao nhất 2026',
    content: `# Bí quyết bán laptop cũ được giá cao nhất 2026

## Tại sao nhiều người bán laptop cũ bị ép giá?

Đa số người bán không biết cách định giá đúng và thiếu kỹ năng thương lượng...

## 7 bí quyết để bán laptop cũ giá cao

### 1. Vệ sinh và refurbish laptop trước khi đăng bán
Một chiếc laptop sạch sẽ, bàn phím không bụi bẩn có thể bán cao hơn 15-20%...

### 2. Chụp ảnh chuyên nghiệp
- Ảnh rõ nét, đủ ánh sáng
- Chụp từ nhiều góc độ
- Bao gồm ảnh màn hình bật lên

### 3. Mô tả đầy đủ và trung thực
Liệt kê đầy đủ cấu hình, tình trạng thực tế...

## FAQ

**Nên bán laptop cũ ở đâu được giá nhất?**
Các sàn C2C như Vua Tốt thường có giá tốt hơn shop thu mua...

## Kết luận

Đăng tin bán laptop cũ ngay hôm nay tại Vua Tốt để tiếp cận hàng triệu người mua!`,
    word_count: 1687,
    intent: 'Commercial',
    reason: 'Xu hướng tìm kiếm tăng 35% trong tháng 9/2026, từ khóa có intent bán hàng cao',
    generated_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'pending_review',
  },
  {
    id: '3',
    keyword: 'mua xe máy cũ trả góp lãi suất thấp',
    title: 'Mua xe máy cũ trả góp lãi suất thấp: Hướng dẫn chi tiết',
    content: `# Mua xe máy cũ trả góp lãi suất thấp: Hướng dẫn chi tiết

## Mua xe máy cũ trả góp có lợi không?

Trả góp giúp bạn sở hữu xe ngay hôm nay mà không cần vốn lớn...

## Các hình thức trả góp phổ biến

### 1. Trả góp qua ngân hàng
Lãi suất 8-12%/năm, thủ tục cần CMND, sổ hộ khẩu...

### 2. Trả góp qua công ty tài chính
Nhanh hơn nhưng lãi suất cao hơn 15-20%/năm...

### 3. Trả góp trực tiếp với người bán
Thỏa thuận linh hoạt, không qua trung gian...

## FAQ

**Trả góp xe máy cũ cần điều kiện gì?**
Thường cần thu nhập ổn định, CMND, và đặt cọc 20-30%...

## Kết luận

Tìm ngay xe máy cũ trả góp uy tín tại Vua Tốt!`,
    word_count: 1445,
    intent: 'Transactional',
    reason: 'Volume 3,200/tháng, KD = 12 (rất thấp), ít bài viết chi tiết trên Google',
    generated_at: new Date(Date.now() - 7200000).toISOString(),
    status: 'pending_review',
  },
]

export default function ReviewPage() {
  const [articles, setArticles] = useState<PendingArticle[]>([])
  const [dbConnected, setDbConnected] = useState(false)
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<PendingArticle | null>(null)
  const [running, setRunning] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null) // id bài đang publish

  useEffect(() => {
    fetchPendingArticles()
  }, [])

  const fetchPendingArticles = async () => {
    setLoadingArticles(true)
    try {
      const res = await fetch('/api/articles?status=pending_review')
      const data = await res.json()
      setDbConnected(data.db_connected)
      if (data.db_connected && data.articles?.length > 0) {
        // Map Supabase articles to PendingArticle shape
        const mapped: PendingArticle[] = data.articles.map((a: any) => ({
          id: a.id,
          keyword: a.target_keyword,
          title: a.title,
          content: a.content || '',
          word_count: a.word_count || 0,
          intent: a.intent || 'Informational',
          reason: a.seo_reason || `Volume: ${a.keyword_volume || '—'} | KD: ${a.keyword_kd || '—'}`,
          generated_at: a.created_at,
          status: 'pending_review',
          image_url: a.image_url,
          image_source: a.image_source,
          image_alt: a.image_alt,
        }))
        setArticles(mapped)
        if (mapped.length > 0) setSelectedArticle(mapped[0])
      } else {
        // Fallback to demo data when DB not connected
        setArticles(MOCK_ARTICLES)
        setSelectedArticle(MOCK_ARTICLES[0])
      }
    } catch {
      setArticles(MOCK_ARTICLES)
      setSelectedArticle(MOCK_ARTICLES[0])
    }
    setLoadingArticles(false)
  }

  const pendingCount = articles.filter(a => a.status === 'pending_review').length
  const approvedCount = articles.filter(a => a.status === 'approved').length

  const handleApprove = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a))
    if (selectedArticle?.id === id) setSelectedArticle(prev => prev ? { ...prev, status: 'approved' } : null)
    toast.success('Đã duyệt bài! Bài viết sẽ được lên lịch publish.')
  }

  const handleReject = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a))
    if (selectedArticle?.id === id) setSelectedArticle(null)
    toast.info('Đã bỏ qua bài viết này.')
  }

  const handlePublishToWebsite = async (article: PendingArticle) => {
    const savedConfig = localStorage.getItem('website_publish_config')
    if (!savedConfig) {
      toast.error('Chưa cấu hình website! Vào Cài đặt để điền thông tin.')
      return
    }
    const config = JSON.parse(savedConfig)
    if (!config.adminUrl || !config.username || !config.password) {
      toast.error('Thiếu thông tin đăng nhập. Vào Cài đặt để điền.')
      return
    }

    setPublishing(article.id)
    const steps = ['Đăng nhập admin...', 'Upload ảnh thumbnail...', 'Điền nội dung...', 'Chọn danh mục...', 'Đang publish...']
    let stepIdx = 0
    const interval = setInterval(() => {
      if (stepIdx < steps.length) toast.info(steps[stepIdx++], { duration: 3000 })
    }, 4000)

    try {
      const res = await fetch('/api/publish/laravel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: {
            title: article.title,
            content: article.content,
            keyword: article.keyword,
            intent: article.intent,
            imageUrl: article.image_url,
            imageAlt: article.image_alt || article.keyword,
          },
          config,
        }),
      })
      const data = await res.json()
      clearInterval(interval)

      if (data.success) {
        toast.success(`✅ Đăng bài thành công! Danh mục: "${data.selectedCategory}"`)
        setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: 'approved' } : a))
        if (selectedArticle?.id === article.id) {
          setSelectedArticle(prev => prev ? { ...prev, status: 'approved' } : null)
        }
        if (data.postUrl) window.open(data.postUrl, '_blank')
      } else {
        toast.error(`Lỗi: ${data.error || data.message}`)
      }
    } catch {
      clearInterval(interval)
      toast.error('Không kết nối được. Kiểm tra lại cài đặt.')
    } finally {
      setPublishing(null)
    }
  }

  const handleRegenerateImage = async (article: PendingArticle) => {
    toast.info('Đang tạo ảnh mới với AI...')
    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: article.keyword, title: article.title }),
      })
      const data = await res.json()
      if (data.success) {
        setArticles(prev => prev.map(a => a.id === article.id ? {
          ...a,
          image_url: data.image.url,
          image_source: data.image.source,
          image_alt: data.image.alt,
        } : a))
        if (selectedArticle?.id === article.id) {
          setSelectedArticle(prev => prev ? { ...prev, image_url: data.image.url, image_source: data.image.source } : null)
        }
        toast.success(data.message)
      }
    } catch {
      toast.error('Không tạo được ảnh')
    }
  }

  const handleRunNow = async () => {
    setRunning(true)
    toast.info('Đang chạy AI quét từ khóa và viết bài...', { duration: 5000 })
    try {
      const res = await fetch('/api/cron/daily-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`AI đã tạo ${data.articles_generated} bài viết mới!`)
      } else {
        toast.info(data.message || 'Chạy xong. Cần cấu hình API key để tạo bài thật.')
      }
    } catch {
      toast.error('Lỗi khi chạy. Kiểm tra ANTHROPIC_API_KEY.')
    }
    setRunning(false)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đã duyệt</span>
    if (status === 'rejected') return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Bỏ qua</span>
    return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-brand-600" />
            Duyệt bài viết
            {pendingCount > 0 && (
              <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">AI tự động viết bài mỗi ngày — bạn chỉ cần đọc và duyệt</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">{dbConnected ? '✅ Supabase' : '⚠️ Demo data'}</p>
            <p className="text-sm font-semibold text-gray-700">Mỗi ngày lúc 7:00 sáng</p>
          </div>
          <button
            onClick={fetchPendingArticles}
            disabled={loadingArticles}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loadingArticles && 'animate-spin')} />
          </button>
          <button
            onClick={handleRunNow}
            disabled={running}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Đang chạy...' : 'Chạy ngay hôm nay'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-3 bg-brand-50 border-b border-brand-100 flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-yellow-600" />
          <span className="text-gray-700"><strong className="text-yellow-700">{pendingCount}</strong> bài chờ duyệt</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-gray-700"><strong className="text-green-700">{approvedCount}</strong> bài đã duyệt hôm nay</span>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          Lần chạy cuối: hôm nay lúc 07:00
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Article list */}
        <div className="w-96 border-r border-gray-100 overflow-y-auto bg-white">
          {articles.map(article => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className={cn(
                'p-4 border-b border-gray-50 cursor-pointer transition-colors',
                selectedArticle?.id === article.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : 'hover:bg-gray-50',
                article.status === 'rejected' && 'opacity-50'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">{article.title}</p>
                {getStatusBadge(article.status)}
              </div>
              <p className="text-xs text-brand-600 mb-1">🔑 {article.keyword}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{article.reason}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{article.word_count.toLocaleString()} từ</span>
                <span className={cn('px-1.5 py-0.5 rounded-full',
                  article.intent === 'Informational' ? 'bg-blue-50 text-blue-600' :
                  article.intent === 'Commercial' ? 'bg-purple-50 text-purple-600' :
                  'bg-green-50 text-green-600'
                )}>{article.intent}</span>
              </div>

              {article.status === 'pending_review' && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={e => { e.stopPropagation(); handleApprove(article.id) }}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleReject(article.id) }}
                    className="flex items-center justify-center gap-1 text-gray-500 py-1.5 px-3 rounded-lg text-xs border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Bỏ
                  </button>
                </div>
              )}
            </div>
          ))}

          {articles.length === 0 && (
            <div className="p-8 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Chưa có bài nào hôm nay</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">AI sẽ tự động tạo bài lúc 7h sáng</p>
              <button onClick={handleRunNow} className="text-sm text-brand-600 hover:underline">
                Chạy ngay bây giờ →
              </button>
            </div>
          )}
        </div>

        {/* Right: Article preview */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {selectedArticle ? (
            <div className="p-6">
              {/* Article header */}
              <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-xl font-bold text-gray-900">{selectedArticle.title}</h2>
                  {getStatusBadge(selectedArticle.status)}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>🔑 <strong>{selectedArticle.keyword}</strong></span>
                  <span>📊 {selectedArticle.word_count.toLocaleString()} từ</span>
                  <span>🎯 {selectedArticle.intent}</span>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800"><strong>Lý do AI chọn từ khóa này:</strong> {selectedArticle.reason}</p>
                </div>

                {selectedArticle.status === 'pending_review' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {/* Nút chính: Đăng thẳng lên website */}
                    <button
                      onClick={() => handlePublishToWebsite(selectedArticle)}
                      disabled={publishing === selectedArticle.id}
                      className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      {publishing === selectedArticle.id
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tự động đăng bài...</>
                        : <><Globe className="w-4 h-4" /> Duyệt & Đăng thẳng lên vuatot.vn</>
                      }
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(selectedArticle.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Duyệt (lưu nháp)
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Edit3 className="w-4 h-4" /> Sửa
                      </button>
                      <button
                        onClick={() => handleReject(selectedArticle.id)}
                        className="flex items-center gap-2 text-red-500 px-4 py-2 rounded-xl text-sm border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Bỏ
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      AI sẽ tự đăng nhập admin, chọn đúng danh mục và publish bài
                    </p>
                  </div>
                )}

                {selectedArticle.status === 'approved' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Đã duyệt — bài sẽ được publish theo lịch</span>
                  </div>
                )}
              </div>

              {/* Thumbnail image */}
              {selectedArticle.image_url && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
                  <div className="relative">
                    <img
                      src={selectedArticle.image_url}
                      alt={selectedArticle.image_alt || selectedArticle.keyword}
                      className="w-full h-52 object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1',
                        selectedArticle.image_source === 'dalle' ? 'bg-purple-600 text-white' :
                        selectedArticle.image_source === 'unsplash' ? 'bg-black/60 text-white' :
                        'bg-gray-500 text-white'
                      )}>
                        <Image className="w-3 h-3" />
                        {selectedArticle.image_source === 'dalle' ? 'DALL-E 3 AI' :
                         selectedArticle.image_source === 'unsplash' ? 'Unsplash' : 'Placeholder'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRegenerateImage(selectedArticle)}
                      className="absolute top-3 right-3 bg-white/90 text-gray-700 px-2 py-1 rounded-lg text-xs flex items-center gap-1 hover:bg-white"
                    >
                      <RefreshCw className="w-3 h-3" /> Tạo ảnh khác
                    </button>
                  </div>
                  {selectedArticle.image_credit && (
                    <p className="text-xs text-gray-400 px-4 py-2">{selectedArticle.image_credit}</p>
                  )}
                </div>
              )}

              {/* Article content */}
              <div className="bg-white rounded-xl border border-gray-100 p-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Nội dung bài viết
                </h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">{selectedArticle.content}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Chọn bài viết bên trái để xem</p>
                <p className="text-sm text-gray-400 mt-1">Đọc nội dung rồi nhấn Duyệt hoặc Bỏ qua</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
