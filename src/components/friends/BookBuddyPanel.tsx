// src/components/friends/BookBuddyPanel.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { userPath } from '@/lib/userPath'

type UserLite = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
}

type RequestState = 'idle' | 'pending' | 'done' | 'error'

export default function BookBuddyPanel() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<UserLite[]>([])
  const [loading, setLoading] = useState(false)

  const [friends, setFriends] = useState<UserLite[]>([])
  const [incomingList, setIncomingList] = useState<UserLite[]>([])
  const [outgoingList, setOutgoingList] = useState<UserLite[]>([])
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [outgoingIds, setOutgoingIds] = useState<Set<string>>(new Set())
  const [incomingIds, setIncomingIds] = useState<Set<string>>(new Set())

  const [clientReady, setClientReady] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setClientReady(true)
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  const [expanded, setExpanded] = useState(false)
  const [compact, setCompact] = useState(true)

  useEffect(() => {
    if (!clientReady) return
    setCompact(isDesktop)
    setExpanded(false)
  }, [clientReady, isDesktop])

  const [addingIds, setAddingIds] = useState<Record<string, RequestState>>({})
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [unreadDm, setUnreadDm] = useState<number>(0)

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let alive = true
    const fetchCounts = async () => {
      try {
        const r1 = await fetch('/api/friends/pending/count', { cache: 'no-store' })
        const j1 = await r1.json().catch(() => ({} as any))
        if (alive && r1.ok) setPendingCount(Number(j1?.count || 0))
      } catch {}
      try {
        const r2 = await fetch('/api/dm/unread-counts', { cache: 'no-store' })
        const j2 = await r2.json().catch(() => ({} as any))
        const val = Number(j2?.count ?? j2?.total ?? 0)
        if (alive && r2.ok) setUnreadDm(isFinite(val) ? val : 0)
      } catch {}
    }
    fetchCounts()
    const t = setInterval(fetchCounts, 20000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/friends/panel', { cache: 'no-store' })
        const j = await res.json()
        if (res.ok) {
          const toLite = (u: any): UserLite => ({
            id: String(u.id),
            name: u.name ?? null,
            username: u.username ?? null,
            slug: u.slug ?? null,
            avatarUrl: u.avatarUrl ?? null,
          })
          const fArr: UserLite[] = Array.isArray(j.friends) ? j.friends.map(toLite) : []
          setFriends(fArr)
          setFriendIds(new Set(fArr.map((x) => x.id)))
          const outgoing = (Array.isArray(j.outgoing) ? j.outgoing : []).map((r: any) => toLite(r.to || r))
          const incoming = (Array.isArray(j.incoming) ? j.incoming : []).map((r: any) => toLite(r.from || r))
          setOutgoingList(outgoing)
          setIncomingList(incoming)
          setOutgoingIds(new Set(outgoing.map((u) => u.id)))
          setIncomingIds(new Set(incoming.map((u) => u.id)))
        } else {
          setFriends([]); setIncomingList([]); setOutgoingList([])
          setFriendIds(new Set()); setOutgoingIds(new Set()); setIncomingIds(new Set())
        }
      } catch {
        setFriends([]); setIncomingList([]); setOutgoingList([])
        setFriendIds(new Set()); setOutgoingIds(new Set()); setIncomingIds(new Set())
      }
    }
    run()
  }, [])

  const visibleFriends = useMemo(() => (expanded ? friends : friends.slice(0, 5)), [friends, expanded])

  async function addFriend(targetId: string) {
    if (!targetId) return
    setAddingIds((m) => ({ ...m, [targetId]: 'pending' }))
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: targetId }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'fail')
      if (j?.status === 'ACCEPTED') {
        setFriendIds((old) => new Set([...old, targetId]))
        setOutgoingIds((old) => { const s = new Set(old); s.delete(targetId); return s })
      } else {
        setOutgoingIds((old) => new Set([...old, targetId]))
        setPendingCount((c) => c + 1)
      }
      setAddingIds((m) => ({ ...m, [targetId]: 'done' }))
    } catch {
      setAddingIds((m) => ({ ...m, [targetId]: 'error' }))
      setTimeout(() => setAddingIds((m) => ({ ...m, [targetId]: 'idle' })), 1500)
    }
  }

  const inputShell =
    isDesktop
      ? 'w-full h-11 rounded-xl border border-white/30 bg-white px-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-white/60'
      : 'w-full h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30'
  const wrapRing = isDesktop ? 'ring-primary' : 'ring-transparent'

  function keepOpenMouseDown(e: React.MouseEvent) { e.preventDefault() }

  function renderAction(u: UserLite) {
    const state = addingIds[u.id] || 'idle'
    const isFriend = friendIds.has(u.id)
    const isOutgoing = outgoingIds.has(u.id)
    const isIncoming = incomingIds.has(u.id)
    if (isFriend) return (<span className="shrink-0 rounded-full px-3 h-8 inline-grid place-items-center text-xs font-semibold bg-gray-100 text-gray-600">Arkadaş</span>)
    if (isOutgoing || state === 'done') return (<span className="shrink-0 rounded-full px-3 h-8 inline-grid place-items-center text-xs font-semibold bg-amber-100 text-amber-700">Beklemede</span>)
    if (isIncoming) return (<span className="shrink-0 rounded-full px-3 h-8 inline-grid place-items-center text-xs font-semibold bg-blue-100 text-blue-700">Sana istek</span>)
    return (
      <button
        type="button"
        onMouseDown={keepOpenMouseDown}
        onClick={() => addFriend(u.id)}
        disabled={state === 'pending'}
        className={`shrink-0 rounded-full px-3 h-8 text-xs font-semibold transition ${state === 'pending' ? 'bg-primary/70 text-white' : 'bg-primary text-white hover:bg-primary/90'} disabled:opacity-60`}
        aria-label="Arkadaş ekle"
      >
        {state === 'pending' ? 'Ekleniyor…' : 'Ekle'}
      </button>
    )
  }

  const hasAnySummary = (pendingCount > 0) || (unreadDm > 0)

  if (!isDesktop) {
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="text-2xl font-extrabold tracking-tight">Book Buddy</div>
        </div>
        <div className="h-1 w-full rounded-full bg-primary" />
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Book Buddy Bul"
            className={inputShell}
            aria-label="Book Buddy Bul"
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
          {open && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-black/10 bg-white text-gray-900 shadow-lg" onMouseDown={(e) => e.preventDefault()}>
              {loading && <div className="px-4 py-3 text-sm text-gray-500">Yükleniyor…</div>}
              {!loading && suggestions.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">Sonuç yok</div>}
              {!loading && suggestions.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                  <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center gap-3 min-w-0 flex-1">
                    <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
                      <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
                    </div>
                  </Link>
                  {renderAction(u)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-full">
          <div className="flex flex-wrap gap-2">
            {visibleFriends.map((f) => (
              <Link key={f.id} href={userPath(f.username, f.name, f.slug)} className="inline-flex items-center rounded-full ring-1 ring-black/10" title={f.name || ''}>
                <img src={f.avatarUrl || '/avatar.png'} alt={f.name || 'Avatar'} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
              </Link>
            ))}
          </div>
          {friends.length > 5 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-sm font-medium text-primary hover:underline"
                aria-expanded={expanded}
              >
                {expanded ? 'Daralt' : 'Tümünü göster'}
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="space-y-6">
            <Section title="Arkadaşlar">
              {friends.length === 0 && <EmptyRow text="Henüz arkadaş yok." />}
              {friends.map((u) => <UserRow key={`f-${u.id}`} u={u} />)}
            </Section>
            <Section title="Gelen istekler">
              {incomingList.length === 0 && <EmptyRow text="Bekleyen istek yok." />}
              {incomingList.map((u) => <UserRow key={`in-${u.id}`} u={u} badge="Sana istek" />)}
            </Section>
            <Section title="Gönderilen istekler">
              {outgoingList.length === 0 && <EmptyRow text="Gönderilmiş istek yok." />}
              {outgoingList.map((u) => <UserRow key={`out-${u.id}`} u={u} badge="Beklemede" />)}
            </Section>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className={`mb-10 rounded-2xl ring-1 ${wrapRing} shadow-sm overflow-hidden`}>
      <div className="bg-primary text-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-extrabold tracking-tight">Book Buddy</div>
            {pendingCount > 0 && (
              <Link href="/friends" className="inline-flex h-7 min-w-[22px] items-center justify-center rounded-full bg-white text-primary px-2 text-xs font-semibold">
                {pendingCount > 99 ? '99+' : pendingCount}
              </Link>
            )}
          </div>
          <button
            type="button"
            aria-label={compact ? 'Genişlet' : 'Küçült'}
            title={compact ? 'Genişlet' : 'Küçült'}
            onClick={() => setCompact((v) => !v)}
            className="h-9 w-9 grid place-content-center rounded-full bg-white text-slate-900 shadow"
          >
            {compact ? (
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 14l4-4 4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Book Buddy Bul"
            className={inputShell}
            aria-label="Book Buddy Bul"
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
          {open && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-black/10 bg-white text-gray-900 shadow-lg" onMouseDown={(e) => e.preventDefault()}>
              {loading && <div className="px-4 py-3 text-sm text-gray-500">Yükleniyor…</div>}
              {!loading && suggestions.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">Sonuç yok</div>}
              {!loading && suggestions.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                  <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center gap-3 min-w-0 flex-1">
                    <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
                      <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
                    </div>
                  </Link>
                  {renderAction(u)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ height: 10 }} />
      </div>

      {isDesktop && compact && hasAnySummary && (
        <div className="bg-white px-5 py-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-800">
            {pendingCount > 0 && (
              <Link href="/friends" className="underline underline-offset-2 font-medium">
                {pendingCount} bekleyen Book Buddy isteğiniz var.
              </Link>
            )}
            {unreadDm > 0 && (
              <Link href="/messages" className="underline underline-offset-2 font-medium">
                {unreadDm} okunmamış mesajınız var.
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-5 pt-3 space-y-4">
        {compact === false && (
          <>
            <div className="max-w-full">
              <div className="flex flex-wrap gap-2">
                {visibleFriends.map((f) => (
                  <Link key={f.id} href={userPath(f.username, f.name, f.slug)} className="inline-flex items-center rounded-full ring-1 ring-black/10" title={f.name || ''}>
                    <img src={f.avatarUrl || '/avatar.png'} alt={f.name || 'Avatar'} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                  </Link>
                ))}
              </div>
              {friends.length > 5 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="text-sm font-medium text-primary hover:underline"
                    aria-expanded={expanded}
                  >
                    {expanded ? 'Daralt' : 'Tümünü göster'}
                  </button>
                </div>
              )}
            </div>

            {expanded && (
              <div className="space-y-6">
                <Section title="Arkadaşlar">
                  {friends.length === 0 && <EmptyRow text="Henüz arkadaş yok." />}
                  {friends.map((u) => <UserRow key={`f-${u.id}`} u={u} />)}
                </Section>
                <Section title="Gelen istekler">
                  {incomingList.length === 0 && <EmptyRow text="Bekleyen istek yok." />}
                  {incomingList.map((u) => <UserRow key={`in-${u.id}`} u={u} badge="Sana istek" />)}
                </Section>
                <Section title="Gönderilen istekler">
                  {outgoingList.length === 0 && <EmptyRow text="Gönderilmiş istek yok." />}
                  {outgoingList.map((u) => <UserRow key={`out-${u.id}`} u={u} badge="Beklemede" />)}
                </Section>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-base font-semibold text-slate-700">{title}</h4>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <div className="text-sm text-gray-500">{text}</div>
}

function UserRow({ u, badge }: { u: UserLite; badge?: string }) {
  return (
    <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center justify-between rounded-xl ring-1 ring-black/5 px-3 py-2 hover:bg-gray-50">
      <div className="flex items-center gap-3 min-w-0">
        <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-9 w-9 rounded-full object-cover" loading="lazy" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
          <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
        </div>
      </div>
      {badge && <span className="ml-3 shrink-0 rounded-full bg-gray-100 text-gray-600 px-2.5 h-7 inline-grid place-items-center text-[11px] font-semibold">{badge}</span>}
    </Link>
  )
}
