'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Brain, ChevronLeft, FileText, Globe, LayoutDashboard, Search,
  Settings, Share2, Sparkles, TrendingDown, CreditCard, ThumbsUp,
  Wrench, RefreshCw, Target, PenSquare, Coins, Code2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import React from 'react'

type NavLeaf = { href: string; label: string; icon: React.ElementType; badge?: number }
type NavSection = { section: string; items: NavLeaf[] }
type NavItem = NavLeaf | NavSection

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  {
    section: 'CƠ HỘI SEO',
    items: [
      { href: '/dashboard/ai-radar', label: 'AI Market Radar', icon: Brain },
      { href: '/dashboard/google-console', label: 'Google Search Console', icon: Globe },
      { href: '/dashboard/keywords', label: 'Nghiên cứu từ khóa', icon: Search },
      { href: '/dashboard/tools', label: 'Bộ Công Cụ SEO', icon: Wrench },
    ],
  },
  {
    section: 'NỘI DUNG & SEO',
    items: [
      { href: '/dashboard/content/new', label: 'Tạo bài viết mới', icon: PenSquare },
      { href: '/dashboard/review', label: 'Duyệt bài viết', icon: ThumbsUp, badge: 3 },
      { href: '/dashboard/content', label: 'Tất cả bài viết', icon: FileText },
      { href: '/dashboard/topic-cluster', label: 'Kế Hoạch Nội Dung', icon: Target },
      { href: '/dashboard/rank-tracking', label: 'Chống tụt rank', icon: TrendingDown },
      { href: '/dashboard/social', label: 'Mạng xã hội', icon: Share2 },
    ],
  },
  {
    section: 'CÀI ĐẶT',
    items: [
      { href: '/dashboard/websites', label: 'Quản lý website', icon: Globe },
      { href: '/dashboard/settings', label: 'Cài đặt', icon: Settings },
      { href: '/dashboard/developer', label: 'API Developer', icon: Code2 },
      { href: '/dashboard/billing', label: 'Bảng giá', icon: CreditCard },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [planId, setPlanId] = useState<string>('free')

  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(d => {
        if (d.credits !== undefined) setCredits(d.credits)
        if (d.planId) setPlanId(d.planId)
      })
      .catch(() => {})
  }, [])

  function fmtCredits(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
    return n.toLocaleString()
  }

  return (
    <aside className={cn(
      'relative flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-3.5 border-b border-gray-100', collapsed && 'justify-center')}>
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">SEO AI Platform</p>
            <p className="text-xs text-gray-400">100% Autonomous SEO</p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm z-10"
      >
        <ChevronLeft className={cn('w-3 h-3 text-gray-500 transition-transform', collapsed && 'rotate-180')} />
      </button>

      {/* Create Article Button */}
      {!collapsed && (
        <div className="px-3 py-2.5">
          <Link
            href="/dashboard/content/new"
            className="flex items-center justify-center gap-2 w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            <PenSquare className="w-4 h-4" /> Tạo Bài Viết Mới
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item, idx) => {
          if ('href' in item) {
            const Icon = item.icon as React.ElementType
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all group text-sm',
                  isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-brand-600' : 'text-gray-500 group-hover:text-gray-700')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          }

          return (
            <div key={idx} className="mb-1 mt-2">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {item.section}
                </p>
              )}
              {collapsed && <div className="my-2 border-t border-gray-100" />}
              {item.items.map((sub) => {
                const Icon = sub.icon as React.ElementType
                const isActive = pathname === sub.href || (sub.href !== '/dashboard' && pathname.startsWith(sub.href + '/'))
                const badge = sub.badge
                return (
                  <Link key={sub.href} href={sub.href}
                    className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all group text-sm',
                      isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    title={collapsed ? sub.label : undefined}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className={cn('w-4 h-4', isActive ? 'text-brand-600' : 'text-gray-500 group-hover:text-gray-700')} />
                      {(badge ?? 0) > 0 && collapsed && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">{badge}</span>
                      )}
                    </div>
                    {!collapsed && <span className="flex-1">{sub.label}</span>}
                    {!collapsed && (badge ?? 0) > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">{badge}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Credits display */}
      {!collapsed && credits !== null && (
        <div className="px-3 py-2 border-t border-gray-100">
          <Link href="/dashboard/billing"
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
            <Coins className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900">{fmtCredits(credits)} credits</p>
              <p className="text-[10px] text-gray-400 capitalize">{planId} plan</p>
            </div>
            <span className="text-[10px] text-brand-600 group-hover:underline">Nâng cấp</span>
          </Link>
        </div>
      )}

      {/* User */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">vuatot.vn</p>
              <p className="text-[10px] text-gray-400 truncate">nam.mepc@gmail.com</p>
            </div>
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      )}
    </aside>
  )
}
