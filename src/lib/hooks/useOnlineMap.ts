'use client'

import * as React from 'react'

export default function useOnlineMap(ids: string[], refreshMs = 60_000) {
  const uniq = React.useMemo(() => Array.from(new Set(ids.filter(Boolean))), [ids.join(',')])
  const [map, setMap] = React.useState<Record<string, boolean>>({})

  const load = React.useCallback(async () => {
    if (uniq.length === 0) return
    try {
      const res = await fetch(`/api/presence/lookup?ids=${encodeURIComponent(uniq.join(','))}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.items) setMap(j.items)
    } catch {}
  }, [uniq])

  React.useEffect(() => {
    load()
    if (uniq.length === 0) return
    const id = setInterval(load, refreshMs)
    return () => clearInterval(id)
  }, [load, refreshMs, uniq.length])

  return map
}

