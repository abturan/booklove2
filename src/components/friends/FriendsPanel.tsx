// src/components/friends/FriendsPanel.tsx
'use client'

import * as React from 'react'
import FriendRow from './panel/FriendRow'
import { userPath } from '@/lib/userPath'
import type { UserLite } from './types'
import useOnlineMap from '@/lib/hooks/useOnlineMap'

type ApiShape = {
  mutual: UserLite[]
  followers: UserLite[]
  following: UserLite[]
}

export default function FriendsPanel() {
  const [data, setData] = React.useState<ApiShape>({ mutual: [], followers: [], following: [] })
  const [loading, setLoading] = React.useState(true)
  const [err, setErr] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/friends/panel', { cache: 'no-store' })
      if (!res.ok) throw new Error('Sunucuya ulaşılamadı.')
      const j = await res.json()
      setData({
        mutual: Array.isArray(j.mutual) ? j.mutual : [],
        followers: Array.isArray(j.followers) ? j.followers : [],
        following: Array.isArray(j.following) ? j.following : [],
      })
    } catch (e: any) {
      setErr(e?.message || 'Sunucuya ulaşılamadı.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('friends:changed', h)
    return () => window.removeEventListener('friends:changed', h)
  }, [load])

  const online = useOnlineMap([
    ...data.following.map((u) => u.id),
    ...data.followers.map((u) => u.id),
  ])

  const sections: Array<{ title: string; empty: string; list: UserLite[]; info?: string; allowUnfollow: boolean }> = [
    { title: 'Takip', empty: 'Henüz kimseyi takip etmiyorsun.', list: data.following, allowUnfollow: true },
    { title: 'Takipçi', empty: 'Henüz takipçin yok.', list: data.followers, info: '', allowUnfollow: false },
  ]

  return (
    <div className="card overflow-hidden">
      {sections.map(({ title, empty, list, info, allowUnfollow }) => (
        <section key={title} className="px-4 pt-4">
          <h2 className="px-1 pb-2 text-sm font-semibold text-gray-700">{title}</h2>
          <div className="space-y-3 pb-4">
            {loading && list.length === 0 ? (
              <div className="px-1 py-3 text-sm text-gray-600">Yükleniyor…</div>
            ) : list.length === 0 ? (
              <div className="px-1 py-3 text-sm text-gray-600">{empty}</div>
            ) : (
              list.map((u) => <FriendRow key={u.id} u={u} userPath={userPath} allowUnfollow={allowUnfollow} online={!!online[u.id]} />)
            )}
            {info && list.length > 0 && <p className="px-1 text-xs text-gray-500">{info}</p>}
          </div>
        </section>
      ))}

      {err && (
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
            {err}
          </div>
        </div>
      )}
    </div>
  )
}
