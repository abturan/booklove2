// src/components/friends/hooks/useResponsive.ts
'use client'

import { useEffect, useState } from 'react'

export function useResponsive() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])
  const inputShell = isDesktop
    ? 'w-full h-11 rounded-xl border border-white/30 bg-white px-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-white/60'
    : 'w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30'
  const wrapRing = isDesktop ? 'ring-primary' : 'ring-transparent'
  return { isDesktop, inputShell, wrapRing }
}
