// src/components/friends/FriendsPanel.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'

type UserLite = {
  id: string
  name: string | null
  username: string | null
  avatarUrl: string | null
}
type ApiShape = {
  friends: UserLite[]
  incoming: { id: string; from: UserLite }[]
  outgoing: { id: string; to: UserLite }[]
}

function FriendRow({ u }: { u: UserLite }) {
  return (
    <li className="px-4">
      <Link
        href={u.username ? `/u/${u.username}` : '#'}
        prefetch
        className="flex items-center gap-3 py-3"
      >
        <Avatar src={u.avatarUrl ?? null} size={40} alt={u.name || 'Kullanıcı'} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{u.name || 'Kullanıcı'}</div>
          <div className="text-xs text-gray-600 truncate">{u.username ? `@${u.username}` : ''}</div>
        </div>
      </Link>
    </li>
  )
}

export default function FriendsPanel() {
  const [data, setData] = React.useState<ApiShape>({ friends: [], incoming: [], outgoing: [] })
  const [loading, setLoading] = React.useState(true)
  const [err, setErr] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/friends/panel', { cache: 'no-store' })
      if (!res.ok) throw new Error('Sunucuya ulaşılamadı.')
      const j: ApiShape = await res.json()
      setData({
        friends: Array.isArray(j.friends) ? j.friends : [],
        incoming: Array.isArray(j.incoming) ? j.incoming : [],
        outgoing: Array.isArray(j.outgoing) ? j.outgoing : [],
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

  async function respond(reqId: string, action: 'ACCEPT' | 'DECLINE' | 'CANCEL') {
    if (busyId) return
    setBusyId(reqId)
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: reqId, action }),
      })
      if (res.ok) {
        await load()
        window.dispatchEvent(new CustomEvent('friends:changed'))
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* DİKKAT: İç başlık kaldırıldı; sadece sayfa üstündeki başlık kalacak */}

      {/* Arkadaşlar */}
      <section className="px-4 pb-1 pt-4">
        <h2 className="px-1 pb-2 text-sm font-semibold text-gray-700">Book Buddy</h2>
        <ul className="divide-y">
          {loading && data.friends.length === 0 ? (
            <li className="px-4 py-4 text-sm text-gray-600">Yükleniyor…</li>
          ) : data.friends.length === 0 ? (
            <li className="px-4 py-4 text-sm text-gray-600">Henüz arkadaş yok.</li>
          ) : (
            data.friends.map((u) => <FriendRow key={u.id} u={u} />)
          )}
        </ul>
      </section>

      {/* Gelen istekler */}
      <section className="px-4 pt-4">
        <h2 className="px-1 pb-2 text-sm font-semibold text-gray-700">Gelen istekler</h2>
        <ul className="divide-y">
          {data.incoming.length === 0 ? (
            <li className="px-4 py-4 text-sm text-gray-600">Bekleyen istek yok.</li>
          ) : (
            data.incoming.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={r.from?.avatarUrl ?? null} size={36} alt={r.from?.name || 'Kullanıcı'} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.from?.name || 'Kullanıcı'}</div>
                    <div className="text-xs text-gray-600 truncate">
                      {r.from?.username ? `@${r.from.username}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => respond(r.id, 'ACCEPT')}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs disabled:opacity-60"
                  >
                    Kabul et
                  </button>
                  <button
                    onClick={() => respond(r.id, 'DECLINE')}
                    disabled={busyId === r.id}
                    className="px-3 py-1.5 rounded-full border text-xs disabled:opacity-60"
                  >
                    Reddet
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Gönderilen istekler */}
      <section className="px-4 pt-4 pb-5">
        <h2 className="px-1 pb-2 text-sm font-semibold text-gray-700">Gönderilen istekler</h2>
        <ul className="divide-y">
          {data.outgoing.length === 0 ? (
            <li className="px-4 py-4 text-sm text-gray-600">Kayıt yok.</li>
          ) : (
            data.outgoing.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={r.to?.avatarUrl ?? null} size={36} alt={r.to?.name || 'Kullanıcı'} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.to?.name || 'Kullanıcı'}</div>
                    <div className="text-xs text-gray-600 truncate">
                      {r.to?.username ? `@${r.to.username}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => respond(r.id, 'CANCEL')}
                  disabled={busyId === r.id}
                  className="px-3 py-1.5 rounded-full border text-xs disabled:opacity-60"
                >
                  İptal et
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

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
