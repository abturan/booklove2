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

type BuddySets = {
  friends: Set<string>
  incoming: Set<string>
  outgoing: Set<string>
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
  const [sets, setSets] = useState<BuddySets>({ friends: new Set(), incoming: new Set(), outgoing: new Set() })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!isAuthenticated) {
      setSets({ friends: new Set(), incoming: new Set(), outgoing: new Set() })
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
        const friends = new Set<string>((j.friends || []).map((u: any) => String(u.id)))
        const incoming = new Set<string>((j.incoming || []).map((u: any) => String(u.from?.id ?? u.id)))
        const outgoing = new Set<string>((j.outgoing || []).map((u: any) => String(u.to?.id ?? u.id)))
        if (!cancelled) setSets({ friends, incoming, outgoing })
      } catch {
        if (!cancelled) setSets({ friends: new Set(), incoming: new Set(), outgoing: new Set() })
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
    const map = new Map<string, 'friend' | 'incoming' | 'outgoing' | 'none'>()
    members.forEach((m) => {
      if (sets.friends.has(m.id)) map.set(m.id, 'friend')
      else if (sets.incoming.has(m.id)) map.set(m.id, 'incoming')
      else if (sets.outgoing.has(m.id)) map.set(m.id, 'outgoing')
      else map.set(m.id, 'none')
    })
    return map
  }, [members, sets])

  const handleAdd = async (userId: string) => {
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    try {
      await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setSets((prev) => ({ ...prev, outgoing: new Set(prev.outgoing).add(userId) }))
    } catch {}
  }

  const handleAccept = async (userId: string) => {
    if (!isAuthenticated) {
      redirectToLogin()
      return
    }
    try {
      await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'accept' }),
      })
      setSets((prev) => {
        const friends = new Set(prev.friends).add(userId)
        const incoming = new Set(prev.incoming)
        incoming.delete(userId)
        return { ...prev, friends, incoming }
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
                      {status === 'friend' && (
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
                      {status === 'incoming' && (
                        <button
                          type="button"
                          onClick={() => handleAccept(member.id)}
                          className="rounded-full bg-primary px-3 py-1 text-white hover:bg-primary/90"
                        >
                          Kabul Et
                        </button>
                      )}
                      {status === 'outgoing' && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-600">Beklemede</span>
                      )}
                      {status === 'none' && (
                        <button
                          type="button"
                          onClick={() => handleAdd(member.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-100"
                        >
                          Ekle
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
