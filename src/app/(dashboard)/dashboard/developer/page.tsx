'use client'

import { useState, useEffect } from 'react'
import { Code2, Plus, Trash2, Loader2, Copy, Eye, EyeOff, CheckCircle, Key } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at?: string
  created_at: string
}

const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/articles', desc: 'Lấy danh sách bài viết' },
  { method: 'POST', path: '/api/v1/articles', desc: 'Tạo bài viết mới với AI' },
  { method: 'GET', path: '/api/v1/articles/:id', desc: 'Chi tiết bài viết' },
  { method: 'GET', path: '/api/v1/keywords/research', desc: 'Nghiên cứu từ khóa với DataForSEO' },
  { method: 'POST', path: '/api/v1/ai-radar/scan', desc: 'Quét cơ hội AI cho website' },
  { method: 'GET', path: '/api/v1/websites', desc: 'Danh sách websites của bạn' },
  { method: 'POST', path: '/api/v1/google-indexing/submit', desc: 'Submit URL lên Google Indexing API' },
]

const METHOD_STYLE: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
}

export default function DeveloperPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'keys' | 'docs' | 'examples'>('keys')

  useEffect(() => { loadKeys() }, [])

  const loadKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/developer/keys')
      const data = await res.json()
      setKeys(data.keys ?? [])
    } catch {}
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) { toast.error('Nhập tên API key'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setNewKey(data.key)
      setNewKeyName('')
      await loadKeys()
      toast.success('Đã tạo API key!')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi') }
    setCreating(false)
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Thu hồi API key này?')) return
    await fetch('/api/developer/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setKeys(prev => prev.filter(k => k.id !== id))
    toast.success('Đã thu hồi key')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-brand-600" /> Developer API Portal
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Quản lý API keys và tích hợp SEO AI vào ứng dụng của bạn</p>
      </div>

      {/* Tabs */}
      <div className="px-6 bg-white border-b border-gray-100 flex gap-1">
        {[
          { key: 'keys', label: 'API Keys' },
          { key: 'docs', label: 'Documentation' },
          { key: 'examples', label: 'Code Examples' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as 'keys' | 'docs' | 'examples')}
            className={cn('px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-600 hover:text-gray-900')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-5">

        {/* API Keys Tab */}
        {activeTab === 'keys' && (
          <>
            {/* New key revealed */}
            {newKey && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-800">API key đã tạo — Sao chép ngay! Sẽ không hiển thị lại.</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm font-mono text-green-800">
                    {showKey ? newKey : `${newKey.slice(0, 16)}${'•'.repeat(30)}`}
                  </code>
                  <button onClick={() => setShowKey(!showKey)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Đã copy!') }}
                    className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <button onClick={() => setNewKey(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-2">✕</button>
                </div>
              </div>
            )}

            {/* Create new key */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Key className="w-4 h-4 text-brand-600" /> Tạo API Key mới</h3>
              <div className="flex items-center gap-3">
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Tên key (vd: Production, Development)"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button onClick={handleCreate} disabled={creating || !newKeyName.trim()}
                  className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Tạo Key
                </button>
              </div>
            </div>

            {/* Key list */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">API Keys hiện có</h3>
                <span className="text-xs text-gray-400">{keys.filter(k => k.is_active).length} active</span>
              </div>
              {loading ? (
                <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-brand-600 mx-auto" /></div>
              ) : keys.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">Chưa có API key nào</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {keys.map(k => (
                    <div key={k.id} className="flex items-center gap-4 px-5 py-4">
                      <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{k.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{k.key_prefix}••••••••••••••••••••</p>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        <p>Tạo: {new Date(k.created_at).toLocaleDateString('vi-VN')}</p>
                        {k.last_used_at && <p>Dùng lần cuối: {new Date(k.last_used_at).toLocaleDateString('vi-VN')}</p>}
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', k.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400')}>
                        {k.is_active ? 'Active' : 'Revoked'}
                      </span>
                      {k.is_active && (
                        <button onClick={() => handleRevoke(k.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Documentation Tab */}
        {activeTab === 'docs' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Authentication</h3>
              <p className="text-sm text-gray-600 mb-3">Tất cả API yêu cầu header Authorization:</p>
              <code className="block bg-gray-900 text-green-400 rounded-lg p-4 text-sm font-mono">
                Authorization: Bearer sk_your_api_key_here
              </code>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">API Endpoints</h3>
              <div className="space-y-2">
                {ENDPOINTS.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={cn('text-xs font-bold px-2 py-1 rounded font-mono', METHOD_STYLE[ep.method] ?? 'bg-gray-100 text-gray-600')}>
                      {ep.method}
                    </span>
                    <code className="text-sm text-gray-800 font-mono flex-1">{ep.path}</code>
                    <span className="text-xs text-gray-500">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Rate Limits</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {[
                  { plan: 'Free', limit: '100 req/ngày' },
                  { plan: 'Pro', limit: '5,000 req/ngày' },
                  { plan: 'Agency', limit: 'Không giới hạn' },
                ].map(r => (
                  <div key={r.plan} className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="font-semibold text-gray-900">{r.plan}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.limit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-5">
            {[
              {
                title: 'Tạo bài viết với AI (cURL)',
                code: `curl -X POST https://yourapp.com/api/v1/articles \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "keyword": "mua điện thoại cũ",
    "mode": "seo",
    "word_count": 1500
  }'`,
              },
              {
                title: 'Nghiên cứu từ khóa (JavaScript)',
                code: `const response = await fetch('/api/v1/keywords/research?keyword=mua+laptop+cu&mode=related', {
  headers: { 'Authorization': \`Bearer \${API_KEY}\` }
});
const data = await response.json();
console.log(data.keywords); // [{keyword, volume, kd, cpc}, ...]`,
              },
              {
                title: 'Submit URL lên Google Indexing (Python)',
                code: `import requests

response = requests.post('https://yourapp.com/api/v1/google-indexing/submit',
    headers={'Authorization': f'Bearer {API_KEY}'},
    json={'urls': ['https://yoursite.com/bai-viet-1'], 'project_id': 'proj_id'})

print(response.json())  # {'submitted': 1, 'total': 1}`,
              },
            ].map((ex, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 text-sm">{ex.title}</h4>
                  <button onClick={() => { navigator.clipboard.writeText(ex.code); toast.success('Đã copy!') }}
                    className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">{ex.code}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
