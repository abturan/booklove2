'use client'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SessionWatcher() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // authenticated ↔ unauthenticated geçişlerinde yenile
    router.refresh()
  }, [status, router])

  return null
}
