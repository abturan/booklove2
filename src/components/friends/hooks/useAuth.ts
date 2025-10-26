// src/components/friends/hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'

export function useAuth() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch('/api/auth/session', { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (alive) setAuthed(!!j?.user)
      } catch {
        if (alive) setAuthed(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])
  return { authed }
}
