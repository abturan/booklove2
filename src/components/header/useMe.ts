// src/components/header/useMe.ts
'use client'

import { useEffect, useState } from 'react'

type MeLite = { id: string; avatarUrl: string | null }

export function useMe() {
  const [me, setMe] = useState<MeLite | null>(null)
  const [loaded, setLoaded] = useState(false)

  async function fetchMe() {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      if (!res.ok) throw new Error('me-failed')
      setMe(await res.json())
    } catch {
      setMe(null)
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    fetchMe()
    const onUpdated = () => fetchMe()
    window.addEventListener('me:updated', onUpdated)
    return () => window.removeEventListener('me:updated', onUpdated)
  }, [])

  return { me, loaded }
}
