'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function PresencePinger() {
  const { status } = useSession()
  useEffect(() => {
    if (status !== 'authenticated') return
    let stopped = false
    const ping = async () => {
      try { await fetch('/api/presence/ping', { method: 'POST', cache: 'no-store' }) } catch {}
    }
    ping()
    const id = setInterval(ping, 60_000)
    return () => { stopped = true; clearInterval(id) }
  }, [status])
  return null
}

