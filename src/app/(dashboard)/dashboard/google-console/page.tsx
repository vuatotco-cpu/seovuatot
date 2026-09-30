'use client'

import { Globe, Link2, TrendingUp, Search, BarChart3, Loader2, AlertCircle } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface GSCRow { query: string; clicks: number; impressions: number; ctr: number; position: number }
interface GSCSummary { impressions: number; clicks: number; avgCtr: number; avgPosition: number; rows: GSCRow[] }

function GoogleConsoleInner() {
  const searchParams = useSearchParams()
  const [connected, setConnected] = useState(false)
  const [gscData, setGscData] = useState<GSCSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [noClientId, setNoClientId] = useState(false)

  useEffect(() => {
    // Check for OAuth callback result
    if (searchParams.get('connected') === 'true') {
      toast.success('Đã kết nối Google Search Console thành công!')
    }
    if (searchParams.get('error')) {
      toast.error(`Lỗi kết nối GSC: ${searchParams.get('error')}`)
    }
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gsc/status')
      const data = await res.json()
      if (data.connected) {
        setConnected(true)
        setGscData(data.summary ?? null)
      }
      if (data.noClientId) setNoClientId(true)
    } catch {}
    setLoading(false)
  }

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/auth/gsc'
  }

  const rows = gscData?.rows ?? []
  const totalClicks      = gscData?.clicks ?? 0
  const totalImpressions = gscData?.impressions ?? 0
  const avgCTR           = gscData ? gscData.avgCtr.toFixed(1) : '0.0'
  const avgPosition      = gscData ? gscData.avgPosition.toFixed(1) : '0.0'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Search Console</h1>
        <p className="text-gray-500 text-sm mt-0.5">Theo dõi clicks, impressions, CTR và thứ hạng từ khóa</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : !connected ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kết nối Google Search Console</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Kết nối GSC để theo dõi thứ hạng từ khóa, clicks, impressions và tối ưu SEO website của bạn.
          </p>

          {noClientId && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6 text-left max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Cần cấu hình Google OAuth2</p>
                <p className="text-xs text-yellow-700 mt-1">Thêm <code className="bg-yellow-100 px-1 rounded">GOOGLE_CLIENT_ID</code> và <code className="bg-yellow-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> vào .env.local.</p>
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-yellow-700 font-semibold hover:underline mt-1 inline-block">
                  Tạo OAuth2 credentials →
                </a>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 max-w-lg mx-auto mb-8 text-left">
            {[
              { step: '1', text: 'Nhấn "Kết nối GSC" và đăng nhập Google' },
              { step: '2', text: 'Cấp quyền truy cập Search Console' },
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
            disabled={noClientId}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mx-auto disabled:opacity-50"
          >
            <Link2 className="w-5 h-5" />
            Kết nối Google Search Console
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
              {rows.map((row, idx) => (
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

export default function GoogleConsolePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}>
      <GoogleConsoleInner />
    </Suspense>
  )
}
