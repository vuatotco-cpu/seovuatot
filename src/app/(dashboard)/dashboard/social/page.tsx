'use client'

import { Share2, Facebook, Youtube, Zap } from 'lucide-react'

export default function SocialPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-brand-600" /> Mạng xã hội
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Tự động chia sẻ bài viết lên Facebook, YouTube Shorts</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Facebook */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Facebook Page</p>
              <p className="text-xs text-gray-400">Chưa kết nối</p>
            </div>
          </div>
          <button className="w-full py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
            Kết nối Facebook
          </button>
        </div>

        {/* YouTube */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">YouTube Shorts</p>
              <p className="text-xs text-gray-400">Chưa kết nối</p>
            </div>
          </div>
          <button className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
            Kết nối YouTube
          </button>
        </div>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-brand-900">Tính năng sắp ra mắt</p>
          <p className="text-sm text-brand-700 mt-1">
            AI sẽ tự động tạo post Facebook và video Shorts từ bài SEO — chia sẻ đa kênh chỉ với 1 cú click.
          </p>
        </div>
      </div>
    </div>
  )
}
