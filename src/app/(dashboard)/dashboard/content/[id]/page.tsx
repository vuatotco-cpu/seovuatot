'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Edit3, Globe, Loader2, Save, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  target_keyword: string
  content: string
  meta_description: string | null
  slug: string | null
  status: string
  word_count: number
  published_at: string | null
  published_url: string | null
  created_at: string
  mode: string | null
  seo_score: number | null
  geo_score: number | null
  language: string | null
  websites?: { domain: string; name: string }
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published:      { label: 'Đã đăng',  color: 'bg-green-100 text-green-700' },
  draft:          { label: 'Nháp',     color: 'bg-gray-100 text-gray-600' },
  pending_review: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
  scheduled:      { label: 'Lên lịch', color: 'bg-blue-100 text-blue-700' },
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editMeta, setEditMeta] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/articles/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.article) {
          setArticle(d.article)
          setEditContent(d.article.content ?? '')
          setEditTitle(d.article.title ?? '')
          setEditMeta(d.article.meta_description ?? '')
        }
      })
      .catch(() => toast.error('Không tải được bài viết'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSaveEdit = async () => {
    if (!article) return
    setSaving(true)
    const res = await fetch('/api/articles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: article.id, content: editContent, title: editTitle, meta_description: editMeta }),
    })
    if (res.ok) {
      setArticle(prev => prev ? { ...prev, content: editContent, title: editTitle, meta_description: editMeta } : null)
      setEditing(false)
      toast.success('Đã lưu thay đổi!')
    } else {
      toast.error('Lưu thất bại')
    }
    setSaving(false)
  }

  const handlePublish = async () => {
    if (!article) return
    setPublishing(true)
    const res = await fetch('/api/publish/wordpress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: article.id }),
    })
    const data = await res.json()
    if (data.success || data.postUrl) {
      toast.success('Đã đăng lên WordPress!')
      setArticle(prev => prev ? { ...prev, status: 'published', published_url: data.postUrl } : null)
      if (data.postUrl) window.open(data.postUrl, '_blank')
    } else {
      toast.error(data.error || 'Đăng bài thất bại. Kiểm tra cài đặt WordPress.')
    }
    setPublishing(false)
  }

  const handleDelete = async () => {
    if (!article || !confirm('Xóa bài viết này?')) return
    const res = await fetch('/api/articles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: article.id }),
    })
    if (res.ok) { toast.success('Đã xóa bài viết'); router.push('/dashboard/content') }
    else toast.error('Xóa thất bại')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
    </div>
  )

  if (!article) return (
    <div className="p-6">
      <p className="text-gray-500">Không tìm thấy bài viết.</p>
      <Link href="/dashboard/content" className="text-brand-600 hover:underline text-sm mt-2 inline-block">← Quay lại danh sách</Link>
    </div>
  )

  const st = STATUS_MAP[article.status] ?? { label: article.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/content" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900 line-clamp-1">{article.title}</h1>
            <p className="text-xs text-gray-400">{article.websites?.domain ?? ''} • {article.word_count.toLocaleString()} từ • {new Date(article.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Lưu
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { navigator.clipboard.writeText(article.content ?? ''); toast.success('Đã copy!') }}
                className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
              </button>
              {article.status !== 'published' && (
                <button onClick={handlePublish} disabled={publishing}
                  className="flex items-center gap-1.5 text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50">
                  {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  {publishing ? 'Đang đăng...' : 'Đăng lên website'}
                </button>
              )}
              <button onClick={handleDelete} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editing ? (
            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tiêu đề</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Meta description</label>
                <textarea value={editMeta} onChange={e => setEditMeta(e.target.value)} rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nội dung</label>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={30}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y" />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{article.title}</h2>
              {article.meta_description && (
                <p className="text-sm text-gray-500 italic mb-6 pb-4 border-b border-gray-100">{article.meta_description}</p>
              )}
              {article.published_url && (
                <a href={article.published_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-5 hover:bg-green-100">
                  <CheckCircle className="w-3.5 h-3.5" /> Đã đăng: {article.published_url}
                </a>
              )}
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">{article.content}</pre>
            </div>
          )}
        </div>

        {/* Side info */}
        <div className="w-64 border-l border-gray-100 bg-gray-50/50 p-4 overflow-y-auto flex-shrink-0">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin bài viết</p>
          <div className="space-y-3 text-xs">
            <div><span className="text-gray-400">Từ khóa:</span><p className="font-medium text-gray-900 mt-0.5">{article.target_keyword}</p></div>
            <div><span className="text-gray-400">Chế độ:</span><p className="font-medium text-gray-900 mt-0.5">{article.mode ?? 'deep-dive'}</p></div>
            <div><span className="text-gray-400">Số từ:</span><p className="font-medium text-gray-900 mt-0.5">{article.word_count.toLocaleString()} từ</p></div>
            <div><span className="text-gray-400">Ngôn ngữ:</span><p className="font-medium text-gray-900 mt-0.5">{article.language ?? 'vi'}</p></div>
            {article.seo_score != null && <div><span className="text-gray-400">SEO Score:</span><p className="font-medium text-gray-900 mt-0.5">{article.seo_score}/100</p></div>}
            {article.geo_score != null && <div><span className="text-gray-400">GEO Score:</span><p className="font-medium text-gray-900 mt-0.5">{article.geo_score}/100</p></div>}
            <div><span className="text-gray-400">Ngày tạo:</span><p className="font-medium text-gray-900 mt-0.5">{new Date(article.created_at).toLocaleDateString('vi-VN')}</p></div>
            {article.published_at && <div><span className="text-gray-400">Ngày đăng:</span><p className="font-medium text-gray-900 mt-0.5">{new Date(article.published_at).toLocaleDateString('vi-VN')}</p></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
