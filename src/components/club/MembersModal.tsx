"use client"

import { useEffect, useMemo, useState } from 'react'
import Avatar from '@/components/Avatar'
import Link from 'next/link'
import { userPath } from '@/lib/userPath'
import { useRouter } from 'next/navigation'

type Member = {
  id: string
  name: string
  username?: string | null
  slug?: string | null
  avatarUrl: string | null
}

type FollowSets = {
  mutual: Set<string>
  following: Set<string>
  followers: Set<string>
}

type Props = {
  open: boolean
  onClose: () => void
  members: Member[]
  total: number
  isAuthenticated: boolean
  clubSlug: string
}

export default function MembersModal({ open, onClose, members, total, isAuthenticated, clubSlug }: Props) {
  const router = useRouter()
  const [sets, setSets] = useState<FollowSets>({ mutual: new Set(), following: new Set(), followers: new Set() })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!isAuthenticated) {
      setSets({ mutual: new Set(), following: new Set(), followers: new Set() })
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const r = await fetch('/api/friends/panel', { cache: 'no-store' })
        if (!r.ok) throw new Error('auth')
        const j = await r.json()
        const mutual = new Set<string>((j.mutual || []).map((u: any) => String(u.id)))
        const following = new Set<string>((j.following || []).map((u: any) => String(u.id)))
        const followers = new Set<string>((j.followers || []).map((u: any) => String(u.id)))
        if (!cancelled) setSets({ mutual, following, followers })
      } catch {
        if (!cancelled) setSets({ mutual: new Set(), following: new Set(), followers: new Set() })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, isAuthenticated])
  const redirectToLogin = () => {
    const current = typeof window !== 'undefined' ? window.location.href : `/clubs/${clubSlug}`
    window.location.href = `/login?callbackUrl=${encodeURIComponent(current)}`
  }

  const statusMap = useMemo(() => {
    const map = new Map<string, 'mutual' | 'following' | 'follower' | 'none'>()
    members.forEach((m) => {
      if (sets.mutual.has(m.id)) map.set(m.id, 'mutual')
      else if (sets.following.has(m.id)) map.set(m.id, 'following')
      else if (sets.followers.has(m.id)) map.set(m.id, 'follower')
      else map.set(m.id, 'none')
    })
    return map
  }, [members, sets])

  const handleFollow = async (userId: string) => {
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    try {
      const resp = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!resp.ok) throw new Error('follow')
      window.dispatchEvent(new CustomEvent('friends:changed'))
      setSets((prev) => {
        const followers = new Set(prev.followers)
        const mutual = new Set(prev.mutual)
        const following = new Set(prev.following).add(userId)
        if (followers.delete(userId)) {
          mutual.add(userId)
        }
        return { mutual, followers, following }
      })
    } catch {}
  }

  const handleFollowBack = async (userId: string) => {
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    try {
      const resp = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'accept' }),
      })
      if (!resp.ok) throw new Error('follow_back')
      window.dispatchEvent(new CustomEvent('friends:changed'))
      setSets((prev) => {
        const followers = new Set(prev.followers)
        followers.delete(userId)
        const following = new Set(prev.following).add(userId)
        const mutual = new Set(prev.mutual).add(userId)
        return { mutual, followers, following }
      })
    } catch {}
  }

  const handleUnfollow = async (userId: string) => {
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    try {
      const resp = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'unfollow' }),
      })
      if (!resp.ok) throw new Error('unfollow')
      window.dispatchEvent(new CustomEvent('friends:changed'))
      setSets((prev) => {
        const followers = new Set(prev.followers)
        const mutual = new Set(prev.mutual)
        const following = new Set(prev.following)
        following.delete(userId)
        if (mutual.delete(userId)) {
          followers.add(userId)
        }
        return { mutual, followers, following }
      })
    } catch {}
  }

  const handleMessage = async (userId: string) => {
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    if (busyId) return
    setBusyId(userId)
    try {
      const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.threadId) {
        router.push(`/messages/${j.threadId}`)
        router.refresh()
        window.dispatchEvent(new CustomEvent('dm:changed'))
        onClose()
      }
    } finally {
      setBusyId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="members-modal-title"
        className="relative w-full max-w-[520px] overflow-hidden rounded-[24px] bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="flex items-center justify-between bg-[#fa3d30] px-5 py-4 text-white">
          <div>
            <h2 id="members-modal-title" className="text-sm font-semibold uppercase tracking-[0.18em]">
              Katılımcılar
            </h2>
            <p className="text-[11px] text-white/80">Toplam {total}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-white/10"
          >
            Kapat
          </button>
      </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-3 sm:px-6">
          {members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
              Henüz katılımcı yok.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {members.map((member) => {
                const status = statusMap.get(member.id) ?? 'none'
                return (
                  <li key={member.id} className="flex items-center gap-3 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar src={member.avatarUrl} size={40} alt={member.name} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">{member.name}</div>
                        {member.username && <div className="truncate text-xs text-slate-500">@{member.username}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                      {status === 'mutual' && (
                        <button
                          type="button"
                          onClick={() => handleMessage(member.id)}
                          disabled={busyId === member.id}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#fa3d30]/40 bg-[#fa3d30] text-white hover:bg-[#fa3d30]/90 disabled:opacity-60"
                          aria-label="Mesaj Gönder"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 5h16v14H8l-4 4z" />
                          </svg>
                        </button>
                      )}
                      {status === 'follower' && (
                        <button
                          type="button"
                          onClick={() => handleFollowBack(member.id)}
                          className="rounded-full bg-primary px-3 py-1 text-white hover:bg-primary/90"
                        >
                          Takip et
                        </button>
                      )}
                      {status === 'following' && (
                        <button
                          type="button"
                          onClick={() => handleUnfollow(member.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          Takibi bırak
                        </button>
                      )}
                      {status === 'none' && (
                        <button
                          type="button"
                          onClick={() => handleFollow(member.id)}
                          className="rounded-full bg-primary px-3 py-1 text-white hover:bg-primary/90"
                        >
                          Takip et
                        </button>
                      )}
                    </div>
                    <Link
                      href={userPath(member.username, member.name, member.slug)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:bg-slate-100"
                    >
                      Profil
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          {!isAuthenticated && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
              Giriş yaparak katılımcılarla bağlantı kurabilir ve mesaj gönderebilirsiniz.
            </div>
          )}

          {loading && (
            <div className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-slate-400">
              Yükleniyor…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
