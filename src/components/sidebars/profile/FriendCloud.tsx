// src/components/sidebars/profile/FriendCloud.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { safeAvatarUrl } from '@/lib/avatar'
import { userPath } from '@/lib/userPath'
import BareModal from '@/components/ui/BareModal'
import Avatar from '@/components/Avatar'
import FriendAction from '@/components/sidebars/profile/FriendAction'

type FriendLite = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
  relationship?: 'self' | 'friend' | 'outgoing' | 'incoming' | 'none'
}

export default function FriendCloud({
  title = 'Book Buddy',
  count = 0,
  friends = [],
  userId,
}: {
  title?: string
  count?: number
  friends: FriendLite[]
  userId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullList, setFullList] = useState<FriendLite[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || fullList) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/users/friends?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
        if (res.status === 401) {
          setError('Arkadaş listesi için giriş yapmalısınız.')
          return
        }
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          setError('Arkadaş listesi alınamadı. (Geçersiz yanıt)')
          return
        }
        const data = await res.json().catch(() => null)
        if (!cancelled) {
          if (res.ok && Array.isArray(data?.items)) {
            setFullList(data.items)
          } else {
            setError(data?.error || 'Arkadaş listesi alınamadı.')
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Arkadaş listesi alınamadı.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, fullList, userId])

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
            {count}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-primary hover:underline"
        >
          Hepsini gör
        </button>
      </div>
      <div className="flex -space-x-2 overflow-hidden">
        {friends.slice(0, 12).map((f) => (
          <Link
            key={f.id}
            href={userPath(f.username, f.name, f.slug)}
            className="inline-block ring-2 ring-white rounded-full"
            title={f.name || ''}
          >
            <img
              src={safeAvatarUrl(f.avatarUrl, f.id)}
              alt={f.name || 'Avatar'}
              className="w-10 h-10 rounded-full object-cover"
              loading="lazy"
            />
          </Link>
        ))}
        {friends.length === 0 && <span className="text-sm text-gray-500">Henüz arkadaş yok.</span>}
      </div>

      <BareModal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
              {count}
            </span>
          </div>
          {loading && <div className="text-sm text-gray-600">Yükleniyor…</div>}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}
          {!loading && !error && fullList && (
            <div className="divide-y">
              {fullList.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={f.avatarUrl || undefined} size={40} alt={f.name || 'Kullanıcı'} />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{f.name || 'Kullanıcı'}</div>
                      <div className="text-xs text-gray-500 truncate">@{f.username || f.slug || '—'}</div>
                    </div>
                  </div>
                  {f.relationship !== 'self' ? (
                    <FriendAction
                      mode={
                        f.relationship === 'friend'
                          ? 'message'
                          : f.relationship === 'outgoing'
                          ? 'sent'
                          : f.relationship === 'incoming'
                          ? 'pending'
                          : 'canSend'
                      }
                      userId={f.id}
                      appearance="compact"
                    />
                  ) : null}
                </div>
              ))}
              {!fullList.length && <div className="py-4 text-sm text-gray-600">Henüz arkadaş yok.</div>}
            </div>
          )}
        </div>
      </BareModal>
    </section>
  )
}
