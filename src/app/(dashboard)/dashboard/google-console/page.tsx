'use client'

import { Globe, Link2, TrendingUp, Search, BarChart3, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const mockGSCData = [
  { query: 'mua bán đồ cũ uy tín', clicks: 234, impressions: 4200, ctr: 5.6, position: 4.2 },
  { query: 'thanh lý đồ cũ hà nội', clicks: 189, impressions: 3100, ctr: 6.1, position: 3.8 },
  { query: 'chợ đồ cũ online việt nam', clicks: 156, impressions: 2800, ctr: 5.6, position: 5.1 },
  { query: 'mua laptop cũ giá rẻ hà nội', clicks: 142, impressions: 2400, ctr: 5.9, position: 6.3 },
  { query: 'bán điện thoại cũ giá cao', clicks: 98, impressions: 1900, ctr: 5.2, position: 7.2 },
  { query: 'vua tốt mua bán', clicks: 87, impressions: 950, ctr: 9.2, position: 2.1 },
  { query: 'rao vặt đồ cũ miễn phí', clicks: 76, impressions: 1600, ctr: 4.8, position: 8.4 },
  { query: 'thanh lý nội thất cũ', clicks: 65, impressions: 1200, ctr: 5.4, position: 6.9 },
]

export default function GoogleConsolePage() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    await new Promise(r => setTimeout(r, 2000))
    setConnected(true)
    setConnecting(false)
    toast.success('Đã kết nối Google Search Console!')
  }

  const totalClicks = mockGSCData.reduce((s, r) => s + r.clicks, 0)
  const totalImpressions = mockGSCData.reduce((s, r) => s + r.impressions, 0)
  const avgCTR = (mockGSCData.reduce((s, r) => s + r.ctr, 0) / mockGSCData.length).toFixed(1)
  const avgPosition = (mockGSCData.reduce((s, r) => s + r.position, 0) / mockGSCData.length).toFixed(1)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Search Console</h1>
        <p className="text-gray-500 text-sm mt-0.5">Theo dõi clicks, impressions, CTR và thứ hạng từ khóa</p>
      </div>

      {!connected ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kết nối Google Search Console</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Kết nối GSC để theo dõi thứ hạng từ khóa, clicks, impressions và tối ưu SEO website của bạn.
          </p>
          <div className="flex items-start gap-4 max-w-lg mx-auto mb-8 text-left">
            {[
              { step: '1', text: 'Nhấn "Kết nối GSC" và đăng nhập Google' },
              { step: '2', text: 'Chọn website đã xác minh trong GSC' },
              { step: '3', text: 'Xem dữ liệu thứ hạng ngay lập tức' },
            ].map(s => (
              <div key={s.step} className="flex-1 text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">{s.step}</div>
                <p className="text-xs text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mx-auto disabled:opacity-50"
          >
            {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
            {connecting ? 'Đang kết nối...' : 'Kết nối Google Search Console'}
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tổng Clicks', value: totalClicks.toLocaleString(), sub: 'vs tuần trước', change: '+12.3%', icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
              { label: 'Impressions', value: totalImpressions.toLocaleString(), sub: 'vs tuần trước', change: '+8.7%', icon: Search, color: 'text-purple-600 bg-purple-50' },
              { label: 'CTR Trung bình', value: `${avgCTR}%`, sub: 'vs tuần trước', change: '+0.4%', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
              { label: 'Vị trí TB', value: avgPosition, sub: 'vs tuần trước', change: '-1.2', icon: Globe, color: 'text-orange-600 bg-orange-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Top từ khóa</h2>
              <span className="text-xs text-gray-400">28 ngày qua</span>
            </div>
            <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
              <div className="col-span-5">Từ khóa</div>
              <div className="col-span-2 text-center">Clicks</div>
              <div className="col-span-2 text-center">Impressions</div>
              <div className="col-span-1 text-center">CTR</div>
              <div className="col-span-2 text-center">Vị trí</div>
            </div>
            <div className="divide-y divide-gray-50">
              {mockGSCData.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 px-4 py-3.5 hover:bg-gray-50 transition-colors items-center">
                  <div className="col-span-5">
                    <p className="text-sm text-gray-900">{row.query}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm font-semibold text-gray-900">{row.clicks.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-sm text-gray-700">{row.impressions.toLocaleString()}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-sm text-gray-700">{row.ctr}%</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm font-medium ${row.position <= 3 ? 'text-green-600' : row.position <= 10 ? 'text-blue-600' : 'text-gray-600'}`}>
                      #{row.position.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
