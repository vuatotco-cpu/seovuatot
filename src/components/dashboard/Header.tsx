'use client'

import { Bell, ChevronDown, Globe, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useWebsite } from '@/contexts/WebsiteContext'
import { cn } from '@/lib/utils'

export default function Header() {
  const { websites, selected, setSelected, addWebsite, removeWebsite } = useWebsite()

  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [domain, setDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowForm(false)
        setDomain('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = async () => {
    if (!domain.trim()) return
    setAdding(true)
    try {
      await addWebsite(domain.trim())
      setDomain('')
      setShowForm(false)
      setOpen(false)
    } catch {
      /* ignore */
    }
    setAdding(false)
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: empty / page title space */}
      <div />

      <div className="flex items-center gap-3">
        {/* ── Website selector dropdown ── */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => { setOpen(o => !o); setShowForm(false) }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors',
              open
                ? 'bg-brand-50 border-brand-200 text-brand-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            )}
          >
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="max-w-[160px] truncate">
              {selected ? selected.domain : websites.length === 0 ? 'Thêm website' : `${websites.length} website`}
            </span>
            {selected && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
            <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Website list */}
              {websites.length > 0 && (
                <div className="p-2 max-h-52 overflow-y-auto">
                  {websites.map(w => (
                    <div
                      key={w.id}
                      className={cn(
                        'group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors',
                        selected?.id === w.id
                          ? 'bg-brand-50 text-brand-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                      onClick={() => { setSelected(w); setOpen(false) }}
                    >
                      <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{w.domain}</p>
                        {w.niche && (
                          <p className="text-xs text-gray-400 truncate">{w.niche}</p>
                        )}
                      </div>
                      {selected?.id === w.id && (
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); removeWebsite(w.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider */}
              {websites.length > 0 && <div className="border-t border-gray-100" />}

              {/* Add form */}
              {showForm ? (
                <div className="p-3 space-y-2">
                  <input
                    autoFocus
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="example.vn"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={adding || !domain.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 text-white text-sm py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                    >
                      {adding
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Plus className="w-3.5 h-3.5" />
                      }
                      Thêm
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setDomain('') }}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm website mới
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <button className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center hover:ring-2 hover:ring-brand-200 transition-all">
          <span className="text-brand-600 text-sm font-semibold">U</span>
        </button>
      </div>
    </header>
  )
}
