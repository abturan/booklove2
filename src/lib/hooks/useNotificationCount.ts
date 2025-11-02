// src/lib/hooks/useNotificationCount.ts
'use client'

import { useEffect, useState } from 'react'

export default function useNotificationCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const r = await fetch('/api/notifications/counts', { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (alive && r.ok) setCount(Number(j?.total || 0))
      } catch {}
    }
    load()
    const t = setInterval(load, 20000)
    const h = () => load()
    window.addEventListener('notif:changed', h)
    return () => { alive = false; clearInterval(t); window.removeEventListener('notif:changed', h) }
  }, [])
  return { count }
}

