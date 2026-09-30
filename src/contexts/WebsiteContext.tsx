'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface Website {
  id: string
  domain: string
  name: string
  niche?: string
  analysis_status: 'pending' | 'analyzing' | 'done' | 'error'
  created_at: string
}

interface WebsiteContextType {
  websites: Website[]
  selected: Website | null
  setSelected: (w: Website) => void
  addWebsite: (domain: string, name?: string) => Promise<Website>
  removeWebsite: (id: string) => void
}

const WebsiteContext = createContext<WebsiteContextType | null>(null)

const STORAGE_KEY = 'seo_projects_v2'

function loadFromStorage(): Website[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveToStorage(list: Website[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function WebsiteProvider({ children }: { children: ReactNode }) {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selected, setSelectedState] = useState<Website | null>(null)

  useEffect(() => {
    const stored = loadFromStorage()
    setWebsites(stored)
    if (stored.length > 0) setSelectedState(stored[0])
  }, [])

  const setSelected = useCallback((w: Website) => {
    setSelectedState(w)
  }, [])

  const addWebsite = useCallback(async (domain: string, name?: string): Promise<Website> => {
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .toLowerCase()

    // Try API first (saves to Supabase if configured)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanDomain, name: name || cleanDomain }),
      })
      const data = await res.json()
      if (data.project) {
        const w: Website = {
          id: data.project.id,
          domain: data.project.domain,
          name: data.project.name || data.project.domain,
          niche: data.project.niche,
          analysis_status: data.project.analysis_status || 'pending',
          created_at: data.project.created_at || new Date().toISOString(),
        }
        setWebsites(prev => {
          const updated = [w, ...prev.filter(x => x.domain !== w.domain)]
          saveToStorage(updated)
          return updated
        })
        setSelectedState(w)
        return w
      }
    } catch { /* fallback to local below */ }

    // Local fallback
    const w: Website = {
      id: crypto.randomUUID(),
      domain: cleanDomain,
      name: name || cleanDomain,
      analysis_status: 'pending',
      created_at: new Date().toISOString(),
    }
    setWebsites(prev => {
      const updated = [w, ...prev.filter(x => x.domain !== w.domain)]
      saveToStorage(updated)
      return updated
    })
    setSelectedState(w)
    return w
  }, [])

  const removeWebsite = useCallback((id: string) => {
    setWebsites(prev => {
      const updated = prev.filter(w => w.id !== id)
      saveToStorage(updated)
      return updated
    })
    setSelectedState(prev => {
      if (prev?.id !== id) return prev
      const remaining = loadFromStorage().filter(w => w.id !== id)
      return remaining[0] || null
    })
    fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }, [])

  return (
    <WebsiteContext.Provider value={{ websites, selected, setSelected, addWebsite, removeWebsite }}>
      {children}
    </WebsiteContext.Provider>
  )
}

export function useWebsite() {
  const ctx = useContext(WebsiteContext)
  if (!ctx) throw new Error('useWebsite must be used inside WebsiteProvider')
  return ctx
}
