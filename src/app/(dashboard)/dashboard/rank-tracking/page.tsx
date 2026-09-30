'use client'

import { TrendingDown, TrendingUp, Minus, AlertTriangle, RefreshCw } from 'lucide-react'

const tracked = [
  { keyword: 'mua bán điện thoại cũ', pos: 4, prev: 6, vol: 12400, url: '/blog/mua-ban-dien-thoai-cu' },
  { keyword: 'laptop cũ giá rẻ hà nội', pos: 8, prev: 8, vol: 6600, url: '/blog/laptop-cu-gia-re' },
  { keyword: 'xe máy cũ giá tốt', pos: 12, prev: 9, vol: 8800, url: '/blog/xe-may-cu' },
  { keyword: 'đồ gia dụng cũ thanh lý', pos: 23, prev: 15, vol: 3200, url: '/blog/do-gia-dung-cu' },
  { keyword: 'mua bán đồ cũ uy tín', pos: 3, prev: 5, vol: 18000, url: '/blog/do-cu-uy-tin' },
]

export default function RankTrackingPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-brand-600" /> Chống tụt rank
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Theo dõi thứ hạng từ khóa và cảnh báo khi tụt hạng</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Cập nhật ngay
        </button>
      </div>

      {/* Cảnh báo tụt hạng */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-800">2 từ khóa bị tụt hạng nghiêm trọng</p>
          <p className="text-sm text-red-600 mt-0.5">
            "xe máy cũ giá tốt" tụt 3 hạng • "đồ gia dụng cũ thanh lý" tụt 8 hạng
          </p>
          <button className="text-sm text-red-700 font-medium hover:underline mt-2">
            Tạo bài tối ưu ngay với AI →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Từ khóa</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Hạng hiện tại</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Thay đổi</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Volume</th>
            </tr>
          </thead>
          <tbody>
            {tracked.map((row, i) => {
              const diff = row.prev - row.pos
              return (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{row.keyword}</p>
                    <p className="text-xs text-gray-400 truncate">{row.url}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-2xl font-bold text-gray-900">#{row.pos}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {diff > 0 ? (
                      <span className="flex items-center justify-center gap-1 text-green-600 font-semibold text-sm">
                        <TrendingUp className="w-4 h-4" /> +{diff}
                      </span>
                    ) : diff < 0 ? (
                      <span className="flex items-center justify-center gap-1 text-red-500 font-semibold text-sm">
                        <TrendingDown className="w-4 h-4" /> {diff}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-gray-400 text-sm">
                        <Minus className="w-4 h-4" /> —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-600">
                    {row.vol.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
