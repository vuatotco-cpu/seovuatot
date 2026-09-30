'use client'

import { CreditCard, CheckCircle, Zap, Crown } from 'lucide-react'

const plans = [
  {
    name: 'Miễn phí',
    price: '0đ',
    period: '/tháng',
    color: 'gray',
    features: [
      '1 website',
      '3 bài viết/ngày',
      'AI viết bài (Claude Haiku)',
      'Ảnh placeholder',
      'Duyệt thủ công',
    ],
    current: true,
  },
  {
    name: 'Pro',
    price: '299.000đ',
    period: '/tháng',
    color: 'brand',
    features: [
      '5 website',
      '10 bài viết/ngày',
      'AI viết bài (Claude Sonnet — chất lượng cao)',
      'Ảnh AI DALL-E 3',
      'Tự động đăng lên website',
      'Theo dõi thứ hạng',
      'Báo cáo hàng tuần',
    ],
    current: false,
    recommended: true,
  },
  {
    name: 'Agency',
    price: '799.000đ',
    period: '/tháng',
    color: 'purple',
    features: [
      'Không giới hạn website',
      '50 bài viết/ngày',
      'AI Claude Opus (tốt nhất)',
      'Ảnh AI + video shorts',
      'Chia sẻ mạng xã hội tự động',
      'API access',
      'Hỗ trợ ưu tiên 24/7',
    ],
    current: false,
  },
]

export default function BillingPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-600" /> Bảng giá
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Nâng cấp để mở toàn bộ tính năng AI</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={`bg-white rounded-xl border p-5 relative ${
              plan.recommended ? 'border-brand-400 ring-2 ring-brand-100' : 'border-gray-100'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Phổ biến nhất
                </span>
              </div>
            )}

            <div className="mb-4">
              <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.current ? (
              <div className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium text-center">
                Gói hiện tại
              </div>
            ) : (
              <button className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                plan.recommended
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
                {plan.name === 'Agency' ? (
                  <span className="flex items-center justify-center gap-1.5"><Crown className="w-4 h-4" /> Liên hệ</span>
                ) : 'Nâng cấp ngay'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
