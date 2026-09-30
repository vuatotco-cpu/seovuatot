'use client'

import { Globe, Plus, Zap, CheckCircle, Settings } from 'lucide-react'
import Link from 'next/link'

export default function WebsitesPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý website</h1>
        <p className="text-gray-500 text-sm mt-0.5">Website được kết nối để tự động đăng bài</p>
      </div>

      {/* Website hiện tại */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-2xl">🌐</div>
            <div>
              <p className="font-semibold text-gray-900">vuatot.vn</p>
              <p className="text-sm text-gray-500">Mua bán đồ cũ — PHP Laravel</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Hoạt động
                </span>
                <span className="text-xs text-gray-400">3 bài/ngày • 7:00 sáng</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 text-sm text-brand-600 border border-brand-200 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors"
          >
            <Settings className="w-4 h-4" /> Cấu hình
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">47</p>
            <p className="text-xs text-gray-500">Bài đã đăng</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-brand-600">12</p>
            <p className="text-xs text-gray-500">Từ khóa top 10</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">+23%</p>
            <p className="text-xs text-gray-500">Traffic tháng này</p>
          </div>
        </div>
      </div>

      {/* Thêm website mới */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-300 hover:bg-brand-50/30 transition-colors cursor-pointer">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
        <p className="font-medium text-gray-700 mb-1">Thêm website mới</p>
        <p className="text-sm text-gray-500 mb-4">Kết nối thêm website để quản lý SEO tập trung</p>
        <span className="inline-flex items-center gap-1.5 text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full">
          <Zap className="w-3 h-3" /> Gói Pro — Thêm tối đa 5 website
        </span>
      </div>
    </div>
  )
}
