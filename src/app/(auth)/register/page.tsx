'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.')
        router.push('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    'Miễn phí 14 ngày, không cần thẻ tín dụng',
    '50 từ khóa phân tích miễn phí',
    '5 bài viết AI mỗi tháng',
    'Hỗ trợ tiếng Việt 100%',
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">SEO AI</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản miễn phí</h1>
            <p className="text-gray-600 mt-1">Bắt đầu tối ưu SEO với AI ngay hôm nay</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Bằng cách đăng ký, bạn đồng ý với{' '}
                <a href="#" className="text-brand-600 hover:underline">Điều khoản dịch vụ</a> và{' '}
                <a href="#" className="text-brand-600 hover:underline">Chính sách bảo mật</a>
              </p>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-brand-600 font-medium hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Benefits */}
      <div className="hidden lg:flex flex-1 bg-brand-600 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-4">Tại sao chọn SEO AI?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Nền tảng SEO thông minh nhất dành cho thị trường Việt Nam
          </p>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-blue-50">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
