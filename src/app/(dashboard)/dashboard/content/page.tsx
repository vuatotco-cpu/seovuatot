'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Loader2, Trash2, Eye, CheckCircle, Clock, Globe, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Article {
  id: string
  title: string
  target_keyword: string
  status: 'pending_review' | 'approved' | 'published' | 'draft'
  word_count?: number
  created_at: string
  published_at?: string
  published_url?: string
  meta_description?: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_review: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700' },
  published: { label: 'Đã đăng', color: 'bg-green-100 text-green-700' },
  draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-600' },
}

export default function ContentPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/articles${params}`)
      const data = await res.json()
      setArticles(data.articles || [])
      setDbConnected(data.db_connected)
    } catch {
      setArticles([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchArticles() }, [filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bài viết này?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id))
        toast.success('Đã xóa bài viết')
      }
    } catch { toast.error('Lỗi khi xóa') }
    setDeleting(null)
  }

  const counts = {
    all: articles.length,
    pending_review: articles.filter(a => a.status === 'pending_review').length,
    published: articles.filter(a => a.status === 'published').length,
    approved: articles.filter(a => a.status === 'approved').length,
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" /> Tất cả bài viết
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {dbConnected ? '✅ Dữ liệu từ Supabase' : '⚠️ Chưa kết nối Supabase — cần cấu hình .env.local'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchArticles} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5" /> Tải lại
          </button>
          <Link href="/dashboard/content/new" className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700">
            <Plus className="w-4 h-4" /> Viết bài mới
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-6 py-2 bg-white border-b border-gray-50 flex items-center gap-4">
        {[
          { key: 'all', label: `Tất cả (${counts.all})` },
          { key: 'pending_review', label: `Chờ duyệt (${counts.pending_review})` },
          { key: 'approved', label: `Đã duyệt (${counts.approved})` },
          { key: 'published', label: `Đã đăng (${counts.published})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn('text-sm px-3 py-1.5 rounded-lg transition-colors', filter === tab.key ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-600 hover:text-gray-900')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <FileText className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-600 font-medium mb-1">
              {dbConnected ? 'Chưa có bài viết nào' : 'Chưa kết nối database'}
            </p>
            <p className="text-sm text-gray-400 max-w-sm mb-5">
              {dbConnected
                ? 'AI sẽ tự động tạo bài mỗi sáng 7h, hoặc bạn có thể viết thủ công'
                : 'Cấu hình NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local'}
            </p>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/content/new" className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700">
                <Plus className="w-4 h-4" /> Viết bài đầu tiên
              </Link>
              <Link href="/dashboard/review" className="text-sm text-brand-600 hover:underline">
                Xem bài AI tạo →
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {articles.map(article => (
              <div key={article.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full whitespace-nowrap', STATUS_LABEL[article.status]?.color)}>
                      {STATUS_LABEL[article.status]?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {article.target_keyword && <span>🔑 {article.target_keyword}</span>}
                    {article.word_count && <span>📝 {article.word_count.toLocaleString()} từ</span>}
                    <span>🗓 {new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
                    {article.published_at && (
                      <span>🚀 Đăng: {new Date(article.published_at).toLocaleDateString('vi-VN')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/dashboard/content/${article.id}`}
                    className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                    <Eye className="w-3 h-3" /> Xem
                  </Link>
                  {article.published_url && (
                    <a href={article.published_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                      <ExternalLink className="w-3 h-3" /> Live
                    </a>
                  )}
                  {article.status === 'pending_review' && (
                    <Link href="/dashboard/review" className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1.5 rounded-lg hover:bg-yellow-100">
                      Duyệt
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(article.id)}
                    disabled={deleting === article.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deleting === article.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
