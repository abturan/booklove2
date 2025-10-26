// src/components/friends/hooks/useBuddyCounts.ts
'use client'

import { useEffect, useState } from 'react'

export function useBuddyCounts(enabled: boolean) {
  const [pendingCount, setPending] = useState(0)
  const [unreadDm, setUnread] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    const run = async () => {
      try {
        const r1 = await fetch('/api/friends/pending/count', { cache: 'no-store' })
        const j1 = await r1.json().catch(() => ({}))
        if (alive && r1.ok) setPending(Number(j1?.count || 0))
      } catch {}
      try {
        const r2 = await fetch('/api/dm/unread-counts', { cache: 'no-store' })
        const j2 = await r2.json().catch(() => ({}))
        const v = Number(j2?.count ?? j2?.total ?? 0)
        if (alive && r2.ok) setUnread(isFinite(v) ? v : 0)
      } catch {}
    }
    run()
    const t = setInterval(run, 20000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [enabled])
  return { pendingCount, unreadDm }
}
