// src/components/ads/AdPlacement.tsx
'use client'

import { useEffect, useState } from 'react'
import AdCard from '@/components/ads/AdCard'

export default function AdPlacement({ slot }: { slot: 'hero' | 'sidebar' }) {
  const [ad, setAd] = useState<any | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
        const r = await fetch(`/api/ads/placement?slot=${slot}&device=${isMobile ? 'mobile' : 'desktop'}`, { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (!cancelled) setAd(j?.item || null)
      } catch {
        if (!cancelled) setAd(null)
      }
    })()
    return () => { cancelled = true }
  }, [slot])

  if (!ad) return null
  return <AdCard ad={{ ...ad, slot }} device={'all'} />
}

