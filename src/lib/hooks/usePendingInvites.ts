// src/lib/hooks/usePendingInvites.ts
'use client'

import { useEffect, useState } from 'react'

export default function usePendingInvites() {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    async function fetchCount() {
      try {
        const res = await fetch('/api/friends/pending/count', { cache: 'no-store' })
        if (!res.ok) throw new Error('no-endpoint')
        const j = await res.json()
        if (mounted) setCount(typeof j?.count === 'number' ? j.count : 0)
      } catch {
        if (mounted) setCount(0)
      }
    }
    fetchCount()
    const t = setInterval(fetchCount, 30000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  return { count }
}
