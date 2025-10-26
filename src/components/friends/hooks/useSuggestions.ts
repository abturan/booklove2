// src/components/friends/hooks/useSuggestions.ts
'use client'

import { useEffect, useState } from 'react'
import type { UserLite } from '../types'

export function useSuggestions(enabled: boolean) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<UserLite[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ac = new AbortController()
    const run = async () => {
      const term = q.trim()
      if (!term || !enabled) { setSuggestions([]); setOpen(false); return }
      setLoading(true)
      try {
        const r = await fetch(`/api/users/search?q=${encodeURIComponent(term)}&limit=6`, { cache: 'no-store', signal: ac.signal })
        const j = await r.json()
        if (r.ok) {
          const items = Array.isArray(j.items) ? j.items.map((u: any) => ({
            id: String(u.id), name: u.name ?? null, username: u.username ?? null, slug: u.slug ?? null, avatarUrl: u.avatarUrl ?? null
          })) : []
          setSuggestions(items); setOpen(true)
        } else { setSuggestions([]); setOpen(false) }
      } catch { if (!ac.signal.aborted) { setSuggestions([]); setOpen(false) } }
      finally { setLoading(false) }
    }
    const t = setTimeout(run, 200)
    return () => { clearTimeout(t); ac.abort() }
  }, [q, enabled])

  return { q, setQ, open, setOpen, suggestions, loading }
}
