'use client'

import { useState, useEffect } from 'react'
import {
  Share2, Loader2, CheckCircle, XCircle, Link, ExternalLink,
  Plus, Trash2, RefreshCw, Settings, Send
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SocialAccount {
  id?: string
  platform: string
  account_name?: string
  access_token?: string
  extra?: Record<string, string>
  is_active?: boolean
  connected_at?: string
}

const PLATFORMS = [
  { key: 'facebook',         label: 'Facebook',         color: 'bg-blue-600',   desc: 'Page / Group — đăng bài tự động',         field: 'Page Access Token' },
  { key: 'instagram',        label: 'Instagram',        color: 'bg-gradient-to-br from-pink-500 to-purple-600', desc: 'Business Account via Meta API', field: 'Access Token' },
  { key: 'threads',          label: 'Threads',          color: 'bg-black',      desc: 'Meta Threads API',                        field: 'Access Token' },
  { key: 'linkedin',         label: 'LinkedIn',         color: 'bg-blue-700',   desc: 'Company Page hoặc Personal',              field: 'Access Token' },
  { key: 'telegram',         label: 'Telegram',         color: 'bg-sky-500',    desc: 'Bot Token — đăng vào channel/group',      field: 'Bot Token' },
  { key: 'discord',          label: 'Discord',          color: 'bg-indigo-500', desc: 'Webhook URL — đăng vào server',           field: 'Webhook URL' },
  { key: 'bluesky',          label: 'Bluesky',          color: 'bg-sky-400',    desc: 'AT Protocol — tài khoản Bluesky',         field: 'App Password' },
  { key: 'google_business',  label: 'Google Business',  color: 'bg-green-600',  desc: 'Google My Business Posts API',            field: 'Service Account JSON' },
  { key: 'wordpress_social', label: 'WordPress Social', color: 'bg-blue-500',   desc: 'Đăng bài lên WP blog qua REST API',       field: 'App Password' },
  { key: 'devto',            label: 'Dev.to',           color: 'bg-gray-900',   desc: 'Kỹ thuật — Markdown articles',            field: 'API Key' },
  { key: 'mastodon',         label: 'Mastodon',         color: 'bg-purple-600', desc: 'Fediverse — server tự chọn',              field: 'Access Token' },
  { key: 'tumblr',           label: 'Tumblr',           color: 'bg-indigo-700', desc: 'Tumblr Blog API',                         field: 'OAuth Token' },
]

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    facebook: 'f', instagram: 'ig', threads: '⊕', linkedin: 'in', telegram: '✈', discord: '◈',
    bluesky: '☁', google_business: 'G', wordpress_social: 'W', devto: 'D', mastodon: 'M', tumblr: 't',
  }
  return <span className="text-white font-bold text-sm">{icons[platform] ?? '?'}</span>
}

export default function SocialPage() {
  const [accounts, setAccounts] = useState<Record<string, SocialAccount>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ account_name: '', access_token: '', extra: '{}' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState<string | null>(null)

  useEffect(() => { loadAccounts() }, [])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/social-accounts')
      const data = await res.json()
      if (data.accounts) {
        const map: Record<string, SocialAccount> = {}
        for (const a of data.accounts) map[a.platform] = a
        setAccounts(map)
      }
    } catch {}
    setLoading(false)
  }

  const handleConnect = (platformKey: string) => {
    const existing = accounts[platformKey]
    setEditing(platformKey)
    setForm({
      account_name: existing?.account_name ?? '',
      access_token: existing?.access_token ?? '',
      extra: existing?.extra ? JSON.stringify(existing.extra, null, 2) : '{}',
    })
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      let extra = {}
      try { extra = JSON.parse(form.extra) } catch {}
      const res = await fetch('/api/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editing,
          account_name: form.account_name,
          access_token: form.access_token,
          extra,
        }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success(`Đã kết nối ${PLATFORMS.find(p => p.key === editing)?.label}!`)
      setEditing(null)
      await loadAccounts()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu')
    }
    setSaving(false)
  }

  const handleDisconnect = async (platformKey: string) => {
    if (!confirm('Xóa kết nối này?')) return
    try {
      await fetch('/api/social-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformKey }),
      })
      setAccounts(prev => { const n = {...prev}; delete n[platformKey]; return n })
      toast.success('Đã xóa kết nối')
    } catch { toast.error('Lỗi khi xóa') }
  }

  const handleTestPost = async (platformKey: string) => {
    setPosting(platformKey)
    toast.info(`Đang gửi bài test tới ${PLATFORMS.find(p => p.key === platformKey)?.label}...`)
    try {
      const res = await fetch('/api/social-accounts/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformKey,
          content: '🤖 Test từ SEO AI Platform — kết nối thành công!',
          url: 'https://example.com',
        }),
      })
      const data = await res.json()
      if (data.ok) toast.success(`Đã gửi test tới ${platformKey} thành công!`)
      else toast.error(data.error || 'Gửi thất bại')
    } catch { toast.error('Lỗi kết nối') }
    setPosting(null)
  }

  const connectedCount = Object.keys(accounts).length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-600" /> Social Accounts Hub
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Kết nối {connectedCount}/12 kênh — AI tự động đăng bài khi publish</p>
        </div>
        <button onClick={loadAccounts} className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-3.5 h-3.5" /> Tải lại
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{connectedCount}</p>
              <p className="text-xs text-gray-500">Đã kết nối</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{12 - connectedCount}</p>
              <p className="text-xs text-gray-500">Chưa kết nối</p>
            </div>
          </div>
          <div className="ml-auto">
            <p className="text-xs text-gray-400 text-right">Mỗi khi publish bài, AI sẽ tự động</p>
            <p className="text-xs text-gray-400 text-right">phát tới tất cả kênh đã kết nối</p>
          </div>
        </div>

        {/* Platform grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {PLATFORMS.map(platform => {
              const account = accounts[platform.key]
              const isConnected = !!account
              return (
                <div key={platform.key} className={cn('bg-white rounded-xl border p-5 transition-all', isConnected ? 'border-green-200 shadow-sm' : 'border-gray-100')}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', platform.color)}>
                      <PlatformIcon platform={platform.key} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{platform.label}</p>
                        {isConnected && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Kết nối</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{platform.desc}</p>
                      {isConnected && account.account_name && (
                        <p className="text-xs text-brand-600 mt-0.5 truncate font-medium">@{account.account_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <button onClick={() => handleTestPost(platform.key)} disabled={posting === platform.key}
                          className="flex items-center gap-1 text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                          {posting === platform.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Test
                        </button>
                        <button onClick={() => handleConnect(platform.key)}
                          className="flex items-center gap-1 text-xs border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                          <Settings className="w-3 h-3" /> Sửa
                        </button>
                        <button onClick={() => handleDisconnect(platform.key)}
                          className="flex items-center gap-1 text-xs border border-red-200 text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleConnect(platform.key)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Kết nối {platform.label}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
          <p className="font-semibold mb-1">Lưu ý bảo mật:</p>
          <p>Access Token và API Key được mã hóa trong Supabase với RLS — chỉ tài khoản của bạn mới đọc được. Không chia sẻ token với bất kỳ ai.</p>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {accounts[editing] ? 'Cập nhật kết nối' : 'Kết nối'} {PLATFORMS.find(p => p.key === editing)?.label}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{PLATFORMS.find(p => p.key === editing)?.desc}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Tên tài khoản (tùy chọn)</label>
                <input value={form.account_name} onChange={e => setForm(p => ({...p, account_name: e.target.value}))}
                  placeholder="@username hoặc tên page"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {PLATFORMS.find(p => p.key === editing)?.field} *
                </label>
                <input type="password" value={form.access_token} onChange={e => setForm(p => ({...p, access_token: e.target.value}))}
                  placeholder="Nhập token / API key..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
              </div>
              {(editing === 'telegram' || editing === 'discord' || editing === 'mastodon') && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {editing === 'telegram' ? 'Chat ID / Channel Username' : editing === 'mastodon' ? 'Server URL (vd: mastodon.social)' : 'Server/Guild ID (tùy chọn)'}
                  </label>
                  <input value={JSON.stringify(form.extra) === '{}' ? '' : Object.values(JSON.parse(form.extra))[0] as string ?? ''}
                    onChange={e => {
                      const key = editing === 'telegram' ? 'chat_id' : editing === 'mastodon' ? 'server_url' : 'guild_id'
                      setForm(p => ({...p, extra: JSON.stringify({[key]: e.target.value})}))
                    }}
                    placeholder={editing === 'telegram' ? '@channel_name hoặc -1001234567890' : editing === 'mastodon' ? 'mastodon.social' : 'Server ID'}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Link className="w-3.5 h-3.5" />
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  Hướng dẫn lấy {PLATFORMS.find(p => p.key === editing)?.field}
                </a>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving || !form.access_token.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {accounts[editing] ? 'Cập nhật' : 'Kết nối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
