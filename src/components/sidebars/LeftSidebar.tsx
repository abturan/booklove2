// src/components/sidebars/LeftSidebar.tsx
'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Avatar from '@/components/Avatar'
import PublicVisibilityCard from '@/components/PublicVisibilityCard'
import ShortcutCard from '@/components/ShortcutCard'
import SignOutButton from '@/components/SignOutButton'

type Me = {
  id: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  username: string | null
}

export default function LeftSidebar() {
  const pathname = usePathname()
  const [me, setMe] = React.useState<Me | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  async function load() {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const j = await res.json()
      if (res.ok && j?.id) {
        setMe({
          id: j.id,
          name: j.name ?? null,
          email: j.email ?? null,
          avatarUrl: j.avatarUrl ?? null,
          username: j.username ?? null,
        })
      } else {
        setMe(null)
      }
    } catch {
      setMe(null)
    } finally {
      setLoaded(true)
    }
  }

  React.useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('me:updated', h)
    return () => window.removeEventListener('me:updated', h)
  }, [])

  const showExtras =
    (pathname?.startsWith('/profile/settings') ||
      pathname?.startsWith('/subscriptions') ||
      pathname?.startsWith('/friends') ||
      pathname?.startsWith('/messages') ||
      pathname?.startsWith('/notifications')) ?? false

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Avatar src={me?.avatarUrl ?? null} size={48} alt={me?.name || 'Profil'} />
          <div className="min-w-0">
            <div className="font-medium truncate">
              {loaded ? (me?.name ?? '') : ''}
              {me?.username ? <span className="text-gray-500 font-normal"> (@{me.username})</span> : null}
            </div>
            <div className="text-sm text-gray-600 truncate">{loaded ? (me?.email ?? '') : ''}</div>
          </div>
        </div>
      </div>

      {showExtras && <PublicVisibilityCard username={me?.username ?? null} />}

      {showExtras && <ShortcutCard />}

      <div className="card p-4">
        <SignOutButton />
      </div>

      <div className="card p-4 space-y-2 text-sm text-gray-600">
        <div>Profil bilgilerini güncel tut; öneriler ve kulüp seçimleri buna göre iyileşir.</div>
      </div>
    </div>
  )
}
