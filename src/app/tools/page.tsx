'use client'

import { useState } from 'react'
import { Search, Zap, FileText, Copy, Loader2, Brain, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const FREE_TOOLS = [
  {
    id: 'title-generator',
    label: 'SEO Title Generator',
    desc: 'Tạo 10 tiêu đề SEO tối ưu CTR cho từ khóa của bạn',
    icon: FileText,
    color: 'bg-brand-600',
    inputLabel: 'Từ khóa hoặc chủ đề',
    placeholder: 'mua điện thoại cũ...',
    prompt: (input: string) => `Tạo 10 tiêu đề SEO cho từ khóa "${input}". Mỗi tiêu đề: chứa từ khóa tự nhiên, có con số/năm, 55-65 ký tự, phù hợp thị trường Việt Nam. Đánh số và xếp theo CTR dự đoán.`,
  },
  {
    id: 'meta-description',
    label: 'Meta Description Generator',
    desc: 'Tạo meta description chuẩn SEO 155 ký tự',
    icon: Search,
    color: 'bg-purple-600',
    inputLabel: 'Tiêu đề bài viết hoặc nội dung tóm tắt',
    placeholder: 'Hướng dẫn mua điện thoại cũ uy tín...',
    prompt: (input: string) => `Tạo 5 meta description chuẩn SEO cho trang: "${input}". Mỗi cái: đúng 150-160 ký tự, chứa từ khóa chính, có CTA, hấp dẫn người click. Đánh số và giải thích điểm mạnh.`,
  },
  {
    id: 'slug-generator',
    label: 'SEO Slug Generator',
    desc: 'Chuyển tiêu đề thành URL slug chuẩn SEO',
    icon: Zap,
    color: 'bg-green-600',
    inputLabel: 'Tiêu đề cần chuyển đổi',
    placeholder: 'Cách Mua Điện Thoại Cũ Uy Tín Năm 2026...',
    prompt: (input: string) => `Chuyển tiêu đề sau thành URL slug SEO chuẩn không dấu:\n"${input}"\n\nYêu cầu:\n- Không dấu tiếng Việt\n- Chữ thường, nối bằng gạch ngang\n- Loại bỏ stop words không cần thiết\n- Giữ từ khóa chính\n\nĐưa ra 3 biến thể slug từ ngắn đến đầy đủ.`,
  },
  {
    id: 'entity-extractor',
    label: 'Entity Extractor',
    desc: 'Trích xuất thực thể & semantic keywords từ nội dung',
    icon: Brain,
    color: 'bg-orange-600',
    inputLabel: 'Nội dung hoặc URL cần phân tích',
    placeholder: 'Dán đoạn nội dung hoặc nhập URL...',
    prompt: (input: string) => `Trích xuất tất cả Entity thực thể và Semantic Keywords từ:\n"${input}"\n\nPhân loại:\n1. Entity Chính (Brand, Person, Place, Product)\n2. Entity Phụ (Concepts, Events)\n3. Semantic Keywords (LSI)\n4. Gợi ý tối ưu cho Google Knowledge Graph\n\nTrả lời ngắn gọn, có structured list.`,
  },
]

export default function FreeToolsPage() {
  const [activeTool, setActiveTool] = useState(FREE_TOOLS[0])
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const runTool = async () => {
    if (!input.trim()) { toast.error('Nhập nội dung cần xử lý'); return }
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: input,
          title: activeTool.label,
          intent: 'Informational',
          wordCount: 500,
          systemPrompt: 'Bạn là chuyên gia SEO Việt Nam. Trả lời súc tích, có cấu trúc.',
          customPrompt: activeTool.prompt(input),
        }),
      })
      if (!res.ok) { toast.error('Cần đăng nhập để dùng công cụ'); return }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        let text = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          text += decoder.decode(value)
          setResult(text)
        }
      }
    } catch {
      toast.error('Lỗi — thử đăng nhập để dùng công cụ')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">SEO AI Platform</p>
            <p className="text-xs text-gray-400">Free Tools</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
          <Link href="/login" className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700">Đăng nhập</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Bộ Công Cụ SEO Miễn Phí</h1>
          <p className="text-gray-500">Tối ưu SEO website của bạn với AI — không cần đăng ký</p>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {FREE_TOOLS.map(tool => (
            <button key={tool.id} onClick={() => { setActiveTool(tool); setInput(''); setResult('') }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${activeTool.id === tool.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className={`w-8 h-8 ${tool.color} rounded-lg flex items-center justify-center mb-2`}>
                <tool.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-900 leading-tight">{tool.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{tool.desc}</p>
            </button>
          ))}
        </div>

        {/* Tool interface */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{activeTool.inputLabel}</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={3}
              placeholder={activeTool.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          </div>
          <button onClick={runTool} disabled={loading || !input.trim()}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'AI đang xử lý...' : `Chạy ${activeTool.label}`}
          </button>

          {result && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Kết quả</p>
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success('Đã copy!') }}
                  className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">{result}</pre>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Muốn dùng đầy đủ 20+ công cụ SEO?</h2>
          <p className="text-brand-100 mb-4">Đăng ký miễn phí và nhận 50,000 credits để tạo bài viết, nghiên cứu từ khóa, và quét cơ hội AI</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register" className="bg-white text-brand-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-50 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Bắt đầu miễn phí
            </Link>
            <Link href="/dashboard" className="border border-white/40 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-white/10 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Xem Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
