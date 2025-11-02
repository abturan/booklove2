// src/lib/hooks/useVerifyStatus.ts
'use client'

import { useEffect, useState } from 'react'

export default function useVerifyStatus() {
  const [verified, setVerified] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const r = await fetch('/api/me/verify-status', { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (!alive) return
        if (r.ok) setVerified(Boolean(j?.verified))
        else setVerified(null)
      } catch {
        if (alive) setVerified(null)
      } finally { if (alive) setLoading(false) }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return { verified, loading }
}

