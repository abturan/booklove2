// src/components/feed/post/LikeListModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/Avatar'
import FriendAction from '@/components/sidebars/profile/FriendAction'

type Relationship = 'self' | 'mutual' | 'following' | 'follower' | 'none'
type LikeUser = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
  relationship: Relationship
}

export default function LikeListModal({ postId }: { postId: string }) {
  const { data } = useSession()
  const meId = (data?.user as any)?.id || null
  const [items, setItems] = useState<LikeUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/posts/${postId}/likes`, { cache: 'no-store' })
        const j = await res.json()
        if (!cancelled && Array.isArray(j?.items)) setItems(j.items)
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [postId])

  return (
    <div>
      {loading ? (
        <div className="text-sm text-gray-600">Yükleniyor…</div>
      ) : (
        <div className="divide-y">
          {items.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={u.avatarUrl || undefined} size={40} alt={u.name || 'Kullanıcı'} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.name || 'Kullanıcı'}</div>
                  <div className="text-xs text-gray-500 truncate">@{u.username || u.slug || '—'}</div>
                </div>
              </div>
              {meId && u.id !== meId ? (
                <div className="shrink-0">
                  <FriendAction
                    mode={
                      u.relationship === 'mutual'
                        ? 'message'
                        : u.relationship === 'following'
                        ? 'following'
                        : u.relationship === 'follower'
                        ? 'followBack'
                        : 'follow'
                    }
                    userId={u.id}
                    appearance="compact"
                  />
                </div>
              ) : null}
            </div>
          ))}
          {!items.length && <div className="py-4 text-sm text-gray-600">Henüz beğenen yok.</div>}
        </div>
      )}
    </div>
  )
}
