'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { safeAvatarUrl } from '@/lib/avatar'
import { userPath } from '@/lib/userPath'
import BareModal from '@/components/ui/BareModal'
import CollapsibleSection from '@/components/friends/panel/CollapsibleSection'
import Avatar from '@/components/Avatar'
import FriendAction from '@/components/sidebars/profile/FriendAction'

type FriendLite = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
  relationship?: 'self' | 'mutual' | 'following' | 'follower' | 'none'
}

type ListsState = {
  mutual: FriendLite[]
  followers: FriendLite[]
  following: FriendLite[]
}

export default function FriendCloud({
  title = 'Book Buddy',
  count = 0,
  friends = [],
  followers = [],
  mutual = [],
  userId,
}: {
  title?: string
  count?: number
  friends: FriendLite[]
  followers?: FriendLite[]
  mutual?: FriendLite[]
  userId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lists, setLists] = useState<ListsState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const openRef = useRef(open)

  const preview = friends.length > 0 ? friends : followers
  const followerBadge = lists?.followers?.length ?? count

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    openRef.current = open
  }, [open])

  const fetchLists = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/friends?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
      if (!res.ok) {
        const msg = await res.json().catch(() => null)
        if (mountedRef.current && openRef.current) {
          setError(msg?.error || 'Book Buddy listesi alınamadı.')
        }
        return
      }
      const data = await res.json().catch(() => null)
      if (mountedRef.current && openRef.current) {
        setLists({
          mutual: Array.isArray(data?.items) ? data.items : [],
          followers: Array.isArray(data?.followers) ? data.followers : [],
          following: Array.isArray(data?.following) ? data.following : [],
        })
      }
    } catch (e: any) {
      if (mountedRef.current && openRef.current) setError(e?.message || 'Book Buddy listesi alınamadı.')
    } finally {
      if (mountedRef.current && openRef.current) {
        if (mode === 'initial') {
          setLoading(false)
          setRefreshing(false)
        } else {
          setRefreshing(false)
        }
      }
    }
  }, [userId])

  useEffect(() => {
    if (!open) return
    if (!lists) fetchLists('initial')
  }, [open, lists, fetchLists])

  useEffect(() => {
    if (!open) return
    const handler = () => fetchLists('refresh')
    window.addEventListener('friends:changed', handler)
    window.addEventListener('friends:unfollowed', handler)
    return () => {
      window.removeEventListener('friends:changed', handler)
      window.removeEventListener('friends:unfollowed', handler)
    }
  }, [open, fetchLists])

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">{followerBadge}</span>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="text-sm text-primary hover:underline">
          Hepsini gör
        </button>
      </div>
      <div className="flex -space-x-2 overflow-hidden">
        {preview.slice(0, 12).map((f) => (
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
        {preview.length === 0 && <span className="text-sm text-gray-500">Henüz Book Buddy yok.</span>}
      </div>

      <BareModal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          {loading && !lists && <div className="text-sm text-gray-600">Yükleniyor…</div>}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>
          )}
          {lists && (
            <div className="space-y-4">
              {refreshing && (
                <div className="text-xs text-gray-500">Güncelleniyor…</div>
              )}
              <CollapsibleSection title="Takipçi" count={lists.followers.length} defaultOpen>
                <FollowList
                  emptyText="Henüz takipçiniz yok."
                  items={lists.followers}
                  info="Seni takip edenleri “Takip et” butonuyla Book Buddy listene ekleyebilirsin."
                  allowUnfollow={false}
                />
              </CollapsibleSection>
              <CollapsibleSection title="Takip" count={lists.following.length}>
                <FollowList emptyText="Henüz kimseyi takip etmiyorsunuz." items={lists.following} allowUnfollow />
              </CollapsibleSection>
            </div>
          )}
        </div>
      </BareModal>
    </section>
  )
}

function FollowList({
  emptyText,
  items,
  info,
  allowUnfollow = true,
}: {
  emptyText: string
  items: FriendLite[]
  info?: string
  allowUnfollow?: boolean
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500">{emptyText}</div>
      ) : (
        <div className="divide-y">
          {items.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 py-2">
              <Link href={userPath(f.username, f.name, f.slug)} className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={f.avatarUrl || undefined}
                  size={40}
                  alt={f.name || 'Kullanıcı'}
                  seed={f.username || f.slug || f.id}
                />
                <div className="min-w-0">
                  <div className="font-medium truncate">{f.name || 'Kullanıcı'}</div>
                  <div className="text-xs text-gray-500 truncate">@{f.username || f.slug || '—'}</div>
                </div>
              </Link>
              {f.relationship !== 'self' ? (
                <FriendAction
                  mode={
                    f.relationship === 'mutual'
                      ? 'message'
                      : f.relationship === 'following'
                      ? 'following'
                      : f.relationship === 'follower'
                      ? 'followBack'
                      : 'follow'
                  }
                  userId={f.id}
                  appearance="compact"
                  refreshOnChange={false}
                  allowUnfollow={allowUnfollow}
                />
              ) : null}
            </div>
          ))}
          {info && <p className="pt-2 text-xs text-gray-500">{info}</p>}
        </div>
      )}
    </div>
  )
}
