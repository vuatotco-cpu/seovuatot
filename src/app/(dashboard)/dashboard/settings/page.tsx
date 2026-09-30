'use client'

import {
  Globe, Key, Loader2, Save, Zap, CheckCircle, XCircle,
  RefreshCw, Settings, Bell, FileText, Image, Cpu, Search, Plus, Trash2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Tab = 'general' | 'ai_keys' | 'publishing' | 'automation' | 'notifications' | 'indexing'

interface IndexProject { id: string; project_name: string; client_email: string; quota_used_today: number; quota_reset_at: string }

interface AIStatus { active: boolean; label: string }

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'general',       label: 'Cài Đặt Chung',       icon: Settings },
  { key: 'ai_keys',       label: 'API Keys & AI',        icon: Key },
  { key: 'publishing',    label: 'Xuất Bản CMS',         icon: Globe },
  { key: 'indexing',      label: 'Google Indexing',      icon: Search },
  { key: 'automation',    label: 'Tự Động Hóa',          icon: Zap },
  { key: 'notifications', label: 'Thông Báo',            icon: Bell },
]

const AI_FIELDS = [
  { key: 'anthropic',  statusKey: 'claude',    label: 'Anthropic — Claude Sonnet & Haiku', placeholder: 'sk-ant-...', desc: 'Viết bài SEO chất lượng cao. Ưu tiên #1.', link: 'https://console.anthropic.com', badge: 'Nội dung #1' },
  { key: 'gemini',     statusKey: 'gemini',    label: 'Google Gemini 1.5 Pro',             placeholder: 'AIza...',    desc: 'Miễn phí 15 req/phút. Fallback #2.',         link: 'https://aistudio.google.com/app/apikey', badge: 'Nội dung #2' },
  { key: 'groq',       statusKey: 'groq',      label: 'Groq — Llama 3.1 70B',              placeholder: 'gsk_...',    desc: 'Miễn phí, siêu nhanh. Llama 3.1 70B. Fallback #3.', link: 'https://console.groq.com/keys', badge: 'Nội dung #3 🆓' },
  { key: 'openai',     statusKey: 'openai',    label: 'OpenAI — GPT-4o + DALL-E 3',        placeholder: 'sk-...',     desc: 'GPT-4o viết bài + DALL-E 3 tạo ảnh.',        link: 'https://platform.openai.com/api-keys', badge: 'Nội dung #4 + Ảnh #1' },
  { key: 'deepseek',   statusKey: 'deepseek',  label: 'DeepSeek Chat',                     placeholder: 'sk-...',     desc: 'Rẻ nhất $0.14/1M token. Fallback #5.',       link: 'https://platform.deepseek.com', badge: 'Nội dung #5' },
  { key: 'stability',  statusKey: 'stability', label: 'Stability AI — Stable Diffusion',   placeholder: 'sk-...',     desc: 'Tạo ảnh khi không có DALL-E 3.',        link: 'https://platform.stability.ai', badge: 'Ảnh #2' },
  { key: 'unsplash',   statusKey: 'unsplash',  label: 'Unsplash — Ảnh thật miễn phí',      placeholder: '...',        desc: 'Ảnh thật miễn phí 50 req/giờ.',         link: 'https://unsplash.com/developers', badge: 'Ảnh #3' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [aiStatus, setAiStatus] = useState<Record<string, AIStatus>>({})
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [keyTestResult, setKeyTestResult] = useState<Record<string, { ok: boolean; msg: string } | null>>({})
  const [testingKey, setTestingKey] = useState<string | null>(null)
  // Google Indexing state
  const [indexProjects, setIndexProjects] = useState<IndexProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [saJson, setSaJson] = useState('')
  const [projectName, setProjectName] = useState('')
  const [addingProject, setAddingProject] = useState(false)
  const [urlsToSubmit, setUrlsToSubmit] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ── General settings ─────────────────────────────────────────
  const [general, setGeneral] = useState({
    language: 'vi',
    tone: 'informative',
    wordCount: '1500',
    eeaLevel: 'deep',
    toc: true,
    keyTakeaways: true,
    faqSchema: true,
  })

  // ── Image settings ────────────────────────────────────────────
  const [imageSettings, setImageSettings] = useState({
    style: 'photorealistic',
    aspectRatio: '16:9',
    countPerArticle: '2',
    autoAltText: true,
  })

  // ── Publishing config ─────────────────────────────────────────
  const [publishConfig, setPublishConfig] = useState({
    cmsType: 'wordpress' as 'wordpress' | 'laravel',
    // WordPress REST API
    wpUrl: '',
    wpUsername: '',
    wpAppPassword: '',
    // Legacy Laravel Puppeteer
    adminUrl: '',
    loginUrl: '',
    createPostUrl: '',
    username: '',
    password: '',
    // Common
    publishStatus: 'draft',
    slugRule: 'no-accent',
    articlesPerDay: '3',
    publishTime: '07:00',
  })

  // ── Automation ────────────────────────────────────────────────
  const [automation, setAutomation] = useState({
    googleIndexing: true,
    socialDistribution: false,
    internalLinks: true,
    backlinkNetwork: false,
  })

  // ── Notifications ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    webhookUrl: '',
    weeklyReport: true,
    alertOnPublish: true,
  })

  useEffect(() => {
    loadSettings()
    fetchAIStatus()
    fetch('/api/settings/keys').then(r => r.json()).then(data => {
      if (data.keys) setApiKeys(data.keys)
    }).catch(() => {})
  }, [])

  const loadIndexProjects = async () => {
    setLoadingProjects(true)
    try {
      const res = await fetch('/api/google-indexing')
      const data = await res.json()
      setIndexProjects(data.projects ?? [])
    } catch {}
    setLoadingProjects(false)
  }

  useEffect(() => { if (tab === 'indexing') loadIndexProjects() }, [tab])

  const handleAddProject = async () => {
    if (!saJson.trim()) { toast.error('Paste Service Account JSON vào ô trên'); return }
    setAddingProject(true)
    try {
      const res = await fetch('/api/google-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_account_json: saJson, project_name: projectName }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success('Đã thêm Service Account!')
      setSaJson(''); setProjectName('')
      await loadIndexProjects()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi') }
    setAddingProject(false)
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Xóa Service Account này?')) return
    await fetch('/api/google-indexing', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setIndexProjects(prev => prev.filter(p => p.id !== id))
    toast.success('Đã xóa')
  }

  const handleSubmitUrls = async () => {
    const urls = urlsToSubmit.split('\n').map(u => u.trim()).filter(Boolean)
    if (!urls.length) { toast.error('Nhập ít nhất 1 URL'); return }
    if (!indexProjects.length) { toast.error('Thêm Service Account trước'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/google-indexing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, project_id: indexProjects[0].id }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      toast.success(`Đã gửi ${data.submitted}/${data.total} URL tới Google!`)
      setUrlsToSubmit('')
      await loadIndexProjects()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Lỗi') }
    setSubmitting(false)
  }

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('not_ok')
      const data = await res.json()
      const s = data.settings ?? {}
      if (s['general'])       setGeneral(s['general'])
      if (s['imageSettings']) setImageSettings(s['imageSettings'])
      if (s['publishConfig']) setPublishConfig(s['publishConfig'])
      if (s['automation'])    setAutomation(s['automation'])
      if (s['notifications']) setNotifications(s['notifications'])
    } catch {
      // Fallback to localStorage for users not yet logged in / DB not migrated
      const saved = localStorage.getItem('seo_platform_config')
      if (saved) {
        try {
          const cfg = JSON.parse(saved)
          if (cfg.general)       setGeneral(cfg.general)
          if (cfg.imageSettings) setImageSettings(cfg.imageSettings)
          if (cfg.publishConfig) setPublishConfig(cfg.publishConfig)
          if (cfg.automation)    setAutomation(cfg.automation)
          if (cfg.notifications) setNotifications(cfg.notifications)
        } catch {}
      }
    }
  }

  const handleTestKey = async (fieldKey: string) => {
    const key = apiKeys[fieldKey]?.trim()
    if (!key || key.length < 8) {
      toast.error('Nhập key vào ô trước khi test')
      return
    }
    setTestingKey(fieldKey)
    setKeyTestResult(p => ({ ...p, [fieldKey]: null }))
    try {
      const res = await fetch('/api/settings/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: fieldKey, key }),
      })
      const data = await res.json()
      if (data.ok) {
        setKeyTestResult(p => ({ ...p, [fieldKey]: { ok: true, msg: `✓ ${data.model} · ${data.latency}ms` } }))
        toast.success(`${fieldKey}: Key hợp lệ! (${data.latency}ms)`)
      } else {
        setKeyTestResult(p => ({ ...p, [fieldKey]: { ok: false, msg: data.error || 'Lỗi' } }))
        toast.error(`${fieldKey}: ${data.error}`)
      }
    } catch (err: any) {
      setKeyTestResult(p => ({ ...p, [fieldKey]: { ok: false, msg: err.message } }))
      toast.error(`Lỗi kết nối: ${err.message}`)
    }
    setTestingKey(null)
  }

  const handleSaveKeys = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: apiKeys }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      if (data.saved?.length > 0) {
        toast.success(`Đã lưu ${data.saved.length} key! AI sẵn sàng dùng ngay.`)
        await fetchAIStatus()
      } else {
        toast.info('Không có key mới nào được nhập.')
      }
    } catch {
      toast.error('Lỗi khi lưu key')
    }
    setSaving(false)
  }

  const fetchAIStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch('/api/ai/status')
      const data = await res.json()
      setAiStatus(data.status || {})
    } catch {}
    setLoadingStatus(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to Supabase DB
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ general, imageSettings, publishConfig, automation, notifications }),
      })
      if (!res.ok) throw new Error('db_error')
    } catch {
      // Fallback: save to localStorage if DB not available
      localStorage.setItem('seo_platform_config', JSON.stringify({ general, imageSettings, publishConfig, automation, notifications }))
    }

    // Always mirror publishConfig to localStorage for CMS publisher compatibility
    localStorage.setItem('website_publish_config', JSON.stringify(publishConfig))

    const hasKeys = Object.values(apiKeys).some(v => v && v.trim().length >= 8)
    if (hasKeys) {
      try {
        const res = await fetch('/api/settings/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: apiKeys }),
        })
        const data = await res.json()
        if (data.saved?.length > 0) await fetchAIStatus()
      } catch {}
    }

    toast.success('Đã lưu toàn bộ cấu hình!')
    setSaving(false)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    toast.info('Đang kết nối...', { duration: 6000 })
    try {
      if (publishConfig.cmsType === 'wordpress') {
        if (!publishConfig.wpUrl || !publishConfig.wpUsername || !publishConfig.wpAppPassword) {
          toast.error('Điền đầy đủ WordPress URL, username và Application Password')
          setTesting(false)
          return
        }
        const params = new URLSearchParams({
          wpUrl: publishConfig.wpUrl,
          wpUsername: publishConfig.wpUsername,
          wpAppPassword: publishConfig.wpAppPassword,
        })
        const res = await fetch(`/api/publish/wordpress?${params}`)
        const data = await res.json()
        if (data.ok) {
          toast.success(`✅ Kết nối WordPress thành công! Site: ${data.siteName ?? ''} (WP ${data.wpVersion ?? ''})`)
        } else {
          toast.error(`Lỗi: ${data.error || 'Sai thông tin'}`)
        }
      } else {
        // Legacy Laravel
        if (!publishConfig.adminUrl || !publishConfig.username || !publishConfig.password) {
          toast.error('Điền đầy đủ URL admin, email và mật khẩu')
          setTesting(false)
          return
        }
        const params = new URLSearchParams({ adminUrl: publishConfig.adminUrl, username: publishConfig.username, password: publishConfig.password })
        const res = await fetch(`/api/publish/laravel?${params}`)
        const data = await res.json()
        if (data.loginOk) {
          toast.success(`✅ Kết nối Laravel thành công! Tìm được ${data.categories?.length || 0} danh mục.`)
        } else {
          toast.error(`Đăng nhập thất bại: ${data.error || 'Sai thông tin'}`)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối'
      toast.error(`Không kết nối được: ${msg}`)
    }
    setTesting(false)
  }

  const activeCount = Object.values(aiStatus).filter(s => s?.active).length

  // ─────────────────────────────────────────────────────────────
  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const Toggle = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', checked ? 'bg-brand-600' : 'bg-gray-200')}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', checked && 'translate-x-5')} />
      </button>
    </div>
  )

  const SectionHeader = ({ icon: Icon, title, desc, iconColor = 'text-brand-600 bg-brand-50' }: { icon: React.ElementType; title: string; desc: string; iconColor?: string }) => (
    <div className="flex items-start gap-3 mb-5">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', iconColor)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Cài Đặt Hệ Thống & Tiêu Chuẩn AI</h1>
        <p className="text-xs text-gray-500 mt-0.5">Thiết lập tiêu chuẩn viết bài E-E-A-T, phong cách hình ảnh AI, quy trình xuất bản CMS và kênh thông báo tự động.</p>
      </div>

      {/* Tabs */}
      <div className="px-6 bg-white border-b border-gray-100 flex items-center gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              tab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-5">

          {/* ══ TAB: GENERAL ══════════════════════════════════════════ */}
          {tab === 'general' && (
            <>
              {/* Writing Standards */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <SectionHeader icon={FileText} title="Tiêu Chuẩn Viết Bài & Cấu Trúc E-E-A-T" desc="Thiết lập ngôn ngữ, giọng văn và cấu trúc bài viết chuẩn SEO Google mặc định." iconColor="text-orange-600 bg-orange-50" />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Select label="Ngôn Ngữ Mặc Định" value={general.language} onChange={v => setGeneral(p => ({...p, language: v}))} options={[{ value: 'vi', label: 'Tiếng Việt (Vietnamese)' }, { value: 'en', label: 'English' }]} />
                  <Select label="Giọng Văn Chủ Đạo" value={general.tone} onChange={v => setGeneral(p => ({...p, tone: v}))} options={[
                    { value: 'informative', label: 'Thông Tin & Khách Quan (Informative)' },
                    { value: 'friendly', label: 'Thân Thiện & Gần Gũi (Friendly)' },
                    { value: 'professional', label: 'Chuyên Nghiệp (Professional)' },
                    { value: 'persuasive', label: 'Thuyết Phục (Persuasive)' },
                  ]} />
                  <Select label="Độ Dài Bài Viết Mục Tiêu" value={general.wordCount} onChange={v => setGeneral(p => ({...p, wordCount: v}))} options={[
                    { value: '800', label: '~800 từ (Ngắn gọn)' },
                    { value: '1200', label: '~1,200 từ (Tiêu chuẩn)' },
                    { value: '1500', label: '~1,500 từ (Chuyên sâu E-E-A-T)' },
                    { value: '2500', label: '~2,500 từ (Pillar Content)' },
                    { value: '3000', label: '~3,000 từ (Chuyên gia sâu)' },
                  ]} />
                  <Select label="Mức Độ Chống AI Detection" value={general.eeaLevel} onChange={v => setGeneral(p => ({...p, eeaLevel: v}))} options={[
                    { value: 'basic', label: 'Cơ Bản' },
                    { value: 'medium', label: 'Trung Bình' },
                    { value: 'deep', label: 'Tối Ưu E-E-A-T Chuyên Sâu' },
                  ]} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'toc', label: 'Mục Lục Tự Động (TOC)', desc: 'Chèn lồng mục tự động & anchor link tới đúng đầu văn bản vào mỗi H2 & H3.' },
                    { key: 'keyTakeaways', label: 'Hộp Tóm Tắt (Key Takeaways)', desc: 'Callout box 3-5 ý với từ dấu đậm để giữ người đọc dừng.' },
                    { key: 'faqSchema', label: 'Schema FAQ JSON-LD Chuẩn SEO', desc: 'Tự động phân tích nội dung câu hỏi để đạt chứa Schema Markup giúp chiếm Rich Snippet Google.' },
                  ].map(item => (
                    <label key={item.key} className={cn('flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors', (general as any)[item.key] ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200')}>
                      <input
                        type="checkbox"
                        checked={(general as any)[item.key]}
                        onChange={e => setGeneral(p => ({ ...p, [item.key]: e.target.checked }))}
                        className="mt-0.5 accent-brand-600"
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Image Settings */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <SectionHeader icon={Image} title="Hình Ảnh AI & Phương Tiện Trực Quan" desc="Cấu hình phong cách đồ họa, tỷ lệ khung hình và ưu tiên các Alt Text cho hình ảnh." iconColor="text-blue-600 bg-blue-50" />
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Select label="Phong Cách Hình Ảnh AI Mặc Định" value={imageSettings.style} onChange={v => setImageSettings(p => ({...p, style: v}))} options={[
                    { value: 'photorealistic', label: 'Chụp Ảnh Thật (Photorealistic)' },
                    { value: 'illustration', label: 'Minh Họa (Illustration)' },
                    { value: 'minimalist', label: 'Tối Giản (Minimalist)' },
                    { value: 'infographic', label: 'Infographic Style' },
                  ]} />
                  <Select label="Tỷ Lệ Khung Hình Ảnh" value={imageSettings.aspectRatio} onChange={v => setImageSettings(p => ({...p, aspectRatio: v}))} options={[
                    { value: '16:9', label: '16:9 Landscape (Chuẩn Featured Image blog)' },
                    { value: '4:3', label: '4:3 Standard' },
                    { value: '1:1', label: '1:1 Square (Social)' },
                  ]} />
                  <Select label="Số Lượng Ảnh Mỗi Bài Viết" value={imageSettings.countPerArticle} onChange={v => setImageSettings(p => ({...p, countPerArticle: v}))} options={[
                    { value: '1', label: '1 Ảnh (Thumbnail)' },
                    { value: '2', label: '2 - 3 Ảnh (Đại diện + Thân bài)' },
                    { value: '4', label: '4 - 5 Ảnh (Chuyên sâu)' },
                  ]} />
                </div>
                <label className={cn('flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors', imageSettings.autoAltText ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100')}>
                  <input type="checkbox" checked={imageSettings.autoAltText} onChange={e => setImageSettings(p => ({...p, autoAltText: e.target.checked}))} className="mt-0.5 accent-brand-600" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">Tự Động Sinh Thẻ Alt Text Chứa Từ Khóa SEO</p>
                    <p className="text-xs text-gray-500 mt-0.5">Tự động phân tích nội dung ảnh và gán thẻ alt/description chuẩn SEO khi tải lên website.</p>
                  </div>
                </label>
              </div>
            </>
          )}

          {/* ══ TAB: AI KEYS ══════════════════════════════════════════ */}
          {tab === 'ai_keys' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <SectionHeader icon={Cpu} title="API Keys & Chuỗi Fallback AI" desc="" iconColor="text-purple-600 bg-purple-50" />
                <button onClick={fetchAIStatus} disabled={loadingStatus} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                  <RefreshCw className={cn('w-3.5 h-3.5', loadingStatus && 'animate-spin')} /> Kiểm tra
                </button>
              </div>

              {/* Fallback chain status */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
                <p className="text-xs font-semibold text-purple-800 mb-2">Chuỗi fallback tự động ({activeCount}/7 AI đang hoạt động)</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs text-purple-700 font-medium">Nội dung:</span>
                  {['claude', 'gemini', 'groq', 'openai', 'deepseek'].map((k, i) => {
                    const on = aiStatus[k]?.active
                    const names = ['Claude', 'Gemini', 'Groq', 'GPT-4o', 'DeepSeek']
                    return (
                      <span key={k} className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full', on ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400')}>
                        {on ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {names[i]}
                        {i < 4 && <span className="text-gray-300 ml-1">→</span>}
                      </span>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-blue-700 font-medium">Hình ảnh:</span>
                  {[['openai', 'DALL-E 3'], ['stability', 'Stability AI'], ['unsplash', 'Unsplash']].map(([k, name], i) => {
                    const on = aiStatus[k]?.active
                    return (
                      <span key={k} className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full', on ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400')}>
                        {on ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {name}
                        {i < 2 && <span className="text-gray-300 ml-1">→</span>}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs text-purple-600 mt-3">
                  Cấu hình trong file <code className="bg-white/60 px-1 rounded">D:\seovuatot\.env.local</code> — server tự đọc khi restart
                </p>
              </div>

              <div className="space-y-5">
                {AI_FIELDS.map(field => {
                  const on = aiStatus[field.statusKey]?.active
                  const testRes = keyTestResult[field.key]
                  const isTesting = testingKey === field.key
                  return (
                    <div key={field.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 flex-wrap">
                          {field.label}
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{field.badge}</span>
                          {on !== undefined && (
                            on
                              ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Hoạt động</span>
                              : <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Chưa cấu hình</span>
                          )}
                        </label>
                        <a href={field.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex-shrink-0">Lấy key →</a>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={apiKeys[field.key] || ''}
                          onChange={e => setApiKeys(k => ({ ...k, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                        />
                        <button
                          onClick={() => handleTestKey(field.key)}
                          disabled={isTesting || !apiKeys[field.key]?.trim()}
                          className="flex items-center gap-1.5 px-3 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 whitespace-nowrap flex-shrink-0"
                        >
                          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-yellow-500" />}
                          Test
                        </button>
                      </div>
                      {testRes && (
                        <p className={cn('text-xs mt-1 font-medium', testRes.ok ? 'text-green-600' : 'text-red-500')}>
                          {testRes.msg}
                        </p>
                      )}
                      {!testRes && <p className="text-xs text-gray-400 mt-1">{field.desc}</p>}
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Key được lưu vào <code className="bg-gray-100 px-1 rounded">.env.local</code> và có hiệu lực ngay, không cần restart.
                </p>
                <button
                  onClick={handleSaveKeys}
                  disabled={saving}
                  className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex-shrink-0"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu API Keys
                </button>
              </div>
            </div>
          )}

          {/* ══ TAB: PUBLISHING ═══════════════════════════════════════ */}
          {tab === 'publishing' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <SectionHeader icon={Globe} title="Quy Trình Xuất Bản & Đồng Bộ CMS" desc="Kết nối WordPress REST API hoặc CMS khác để tự động đăng bài." iconColor="text-green-600 bg-green-50" />

              <div className="space-y-4">
                {/* CMS Type selector */}
                <div className="flex gap-3">
                  {[
                    { value: 'wordpress', label: '⚡ WordPress REST API', desc: 'Chuẩn — Hoạt động ngay' },
                    { value: 'laravel',   label: '🔧 Laravel (Puppeteer)', desc: 'Legacy — Chậm hơn' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setPublishConfig(p => ({...p, cmsType: opt.value as 'wordpress' | 'laravel'}))}
                      className={cn('flex-1 p-3 rounded-xl border-2 text-left transition-colors',
                        publishConfig.cmsType === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                      )}>
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {/* WordPress fields */}
                {publishConfig.cmsType === 'wordpress' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Website WordPress *</label>
                      <input type="url" value={publishConfig.wpUrl} onChange={e => setPublishConfig(p => ({...p, wpUrl: e.target.value}))}
                        placeholder="https://yoursite.com"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username WordPress *</label>
                        <input type="text" value={publishConfig.wpUsername} onChange={e => setPublishConfig(p => ({...p, wpUsername: e.target.value}))}
                          placeholder="admin"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Application Password *</label>
                        <input type="password" value={publishConfig.wpAppPassword} onChange={e => setPublishConfig(p => ({...p, wpAppPassword: e.target.value}))}
                          placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                      <strong>Hướng dẫn:</strong> WP Admin → Users → Profile → Application Passwords → Add New. <strong>Không</strong> dùng mật khẩu đăng nhập thông thường.
                    </div>
                  </>
                )}

                {/* Laravel Puppeteer fields (legacy) */}
                {publishConfig.cmsType === 'laravel' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">URL trang admin *</label>
                      <input type="url" value={publishConfig.adminUrl} onChange={e => setPublishConfig(p => ({...p, adminUrl: e.target.value}))}
                        placeholder="https://vuatot.vn/admin"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">URL đăng nhập</label>
                      <input type="url" value={publishConfig.loginUrl} onChange={e => setPublishConfig(p => ({...p, loginUrl: e.target.value}))}
                        placeholder="https://vuatot.vn/admin/login"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">URL tạo bài mới</label>
                      <input type="url" value={publishConfig.createPostUrl} onChange={e => setPublishConfig(p => ({...p, createPostUrl: e.target.value}))}
                        placeholder="https://vuatot.vn/admin/blog/posts/create"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Tên đăng nhập admin *</label>
                      <input type="email" value={publishConfig.username} onChange={e => setPublishConfig(p => ({...p, username: e.target.value}))}
                        placeholder="admin@vuatot.vn"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu admin *</label>
                      <input type="password" value={publishConfig.password} onChange={e => setPublishConfig(p => ({...p, password: e.target.value}))}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <Select label="Trạng Thái Khi Gửi Lên CMS" value={publishConfig.publishStatus} onChange={v => setPublishConfig(p => ({...p, publishStatus: v}))} options={[
                    { value: 'draft', label: 'Lưu Bản Nháp (Draft — Duyệt trước khi đăng)' },
                    { value: 'publish', label: 'Đăng Ngay (Publish trực tiếp)' },
                  ]} />
                  <Select label="Quy Tắc Tạo Đường Dẫn (Slug)" value={publishConfig.slugRule} onChange={v => setPublishConfig(p => ({...p, slugRule: v}))} options={[
                    { value: 'no-accent', label: 'Không Dấu Chuẩn SEO (vd: lam-seo-la-gi)' },
                    { value: 'full-vi', label: 'Tiếng Việt đầy đủ' },
                  ]} />
                  <Select label="Số bài viết/ngày" value={publishConfig.articlesPerDay} onChange={v => setPublishConfig(p => ({...p, articlesPerDay: v}))} options={[
                    { value: '1', label: '1 bài/ngày' },
                    { value: '2', label: '2 bài/ngày' },
                    { value: '3', label: '3 bài/ngày' },
                    { value: '5', label: '5 bài/ngày' },
                  ]} />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Giờ AI chạy tự động hàng ngày</label>
                    <input type="time" value={publishConfig.publishTime} onChange={e => setPublishConfig(p => ({...p, publishTime: e.target.value}))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div className="pt-6">
                    <button onClick={handleTestConnection} disabled={testing}
                      className="flex items-center gap-2 text-brand-600 border border-brand-200 bg-brand-50 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-100 disabled:opacity-50">
                      {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                  <strong>Bảo mật:</strong> Thông tin đăng nhập chỉ lưu trên máy tính của bạn (localStorage), không lưu lên server.
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: GOOGLE INDEXING ════════════════════════════════ */}
          {tab === 'indexing' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <SectionHeader icon={Search} title="Google Indexing API" desc="Tự động ping Google yêu cầu crawl khi đăng bài mới. Cần Service Account với quyền Indexing API." iconColor="text-green-600 bg-green-50" />

                {/* Projects list */}
                {loadingProjects ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
                ) : indexProjects.length > 0 ? (
                  <div className="space-y-3 mb-5">
                    {indexProjects.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{p.project_name}</p>
                          <p className="text-xs text-gray-500">{p.client_email}</p>
                          <p className="text-xs text-gray-400">Quota: {p.quota_used_today}/200 hôm nay</p>
                        </div>
                        <button onClick={() => handleDeleteProject(p.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-5 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800">
                    Chưa có Service Account. Tạo tại Google Cloud Console → IAM & Admin → Service Accounts → Enable Indexing API
                  </div>
                )}

                {/* Add project */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700">Thêm Service Account</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Tên dự án (tùy chọn)</label>
                    <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="vuatot-indexing"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Service Account JSON *</label>
                    <textarea value={saJson} onChange={e => setSaJson(e.target.value)} rows={6}
                      placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",\n  "client_email": "...@....iam.gserviceaccount.com"\n}'}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                  </div>
                  <button onClick={handleAddProject} disabled={addingProject || !saJson.trim()}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
                    {addingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Thêm Service Account
                  </button>
                </div>
              </div>

              {/* URL submission */}
              {indexProjects.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <SectionHeader icon={Globe} title="Submit URL thủ công" desc="Gửi tối đa 200 URL/ngày/project. Mỗi URL 1 dòng." iconColor="text-blue-600 bg-blue-50" />
                  <textarea value={urlsToSubmit} onChange={e => setUrlsToSubmit(e.target.value)} rows={6}
                    placeholder={"https://vuatot.vn/bai-viet-1\nhttps://vuatot.vn/bai-viet-2"}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-3" />
                  <button onClick={handleSubmitUrls} disabled={submitting || !urlsToSubmit.trim()}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Submit tới Google Indexing API
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: AUTOMATION ═══════════════════════════════════════ */}
          {tab === 'automation' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <SectionHeader icon={Zap} title="Tự Động Hóa Xuất Bản & Mạng Lưới SEO" desc="Các hành động tự động thực thi sau khi mỗi bài viết được hoàn thành hoặc xuất bản." iconColor="text-brand-600 bg-brand-50" />
              <div className="grid grid-cols-2 gap-3">
                <Toggle
                  label="Tự Động Báo Google Indexing API"
                  desc="Tự động ping Google Search Console API yêu cầu thu thập dữ liệu trang sau < 24h."
                  checked={automation.googleIndexing}
                  onChange={v => setAutomation(p => ({...p, googleIndexing: v}))}
                />
                <Toggle
                  label="Tự Động Phát Sóng Mạng Xã Hội"
                  desc="Tự động chia sẻ nội dung và đường dẫn tới Facebook, Threads, LinkedIn, X và kênh n.n."
                  checked={automation.socialDistribution}
                  onChange={v => setAutomation(p => ({...p, socialDistribution: v}))}
                />
                <Toggle
                  label="Tự Động Quét & Chèn Link Nội Bộ"
                  desc="Quét sitemap bài cũ và tự động chèn liên kết ngữ nghĩa vào các bài viết cùng cụm."
                  checked={automation.internalLinks}
                  onChange={v => setAutomation(p => ({...p, internalLinks: v}))}
                />
                <Toggle
                  label="Mạng Lưới Trao Đổi Backlink Tự Động"
                  desc="Chạm backlink chéo ngữ cảnh tự nhiên giữa các trang đối tác cùng mạch đề tài có chỉ số Authority."
                  checked={automation.backlinkNetwork}
                  onChange={v => setAutomation(p => ({...p, backlinkNetwork: v}))}
                />
              </div>

              {automation.googleIndexing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-medium text-blue-800 mb-1">Google Indexing API</p>
                  <p className="text-xs text-blue-600 mb-2">Thêm <code className="bg-white/60 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_KEY</code> vào .env.local để kích hoạt tự động ping Google.</p>
                  <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 font-medium hover:underline">
                    Tạo Service Account → Enable Indexing API →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: NOTIFICATIONS ════════════════════════════════════ */}
          {tab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <SectionHeader icon={Bell} title="Thông Báo & Cảnh Báo Hệ Thống (Webhooks)" desc="Nhận thông báo khi bài viết mới, trang chủ Google Index và cảnh báo số dư Creditis." iconColor="text-yellow-600 bg-yellow-50" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Discord / Slack / Telegram Webhook URL</label>
                  <input
                    value={notifications.webhookUrl}
                    onChange={e => setNotifications(p => ({...p, webhookUrl: e.target.value}))}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Gửi thông báo khi AI viết xong bài, khi Google index thành công, và khi có cảnh báo.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Toggle
                    label="Nhận Báo Cáo Hiệu Suất SEO Hằng Tuần Qua Email"
                    desc="Báo cáo tổng hợp số lượt đề xuất SEO index và tiến tốc độ tăng trưởng thứ hạng."
                    checked={notifications.weeklyReport}
                    onChange={v => setNotifications(p => ({...p, weeklyReport: v}))}
                  />
                  <Toggle
                    label="Thông Báo Khi Bài Mới Được Đăng"
                    desc="Nhận webhook ngay khi AI publish xong bài lên website, bao gồm URL bài và danh mục."
                    checked={notifications.alertOnPublish}
                    onChange={v => setNotifications(p => ({...p, alertOnPublish: v}))}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer save button */}
      <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">Cài đặt được lưu vào tài khoản, đồng bộ mọi thiết bị</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : 'Lưu Toàn Bộ Cấu Hình'}
        </button>
      </div>
    </div>
  )
}
