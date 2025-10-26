// src/components/friends/panel/SearchBox.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import type { BuddySets, UserLite } from '../types'

export default function SearchBox({
  q, setQ, open, setOpen, suggestions, loading, inputShell, userPath, sets, addFriend, acceptIncoming, placeholder,
}: {
  q: string
  setQ: (v: string) => void
  open: boolean
  setOpen: (v: boolean) => void
  suggestions: UserLite[]
  loading: boolean
  inputShell: string
  userPath: (u?: string | null, n?: string | null, s?: string | null) => string
  sets: BuddySets
  addFriend: (id: string) => void
  acceptIncoming: (id: string) => void
  placeholder?: string
}) {
  const router = useRouter()
  const ref = useRef<HTMLInputElement | null>(null)
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) { setBox(null); return }
    const el = ref.current
    if (!el || !document.body.contains(el)) return
    const calc = () => {
      const node = ref.current
      if (!node) return
      const r = node.getBoundingClientRect()
      setBox({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    calc()
    const onAny = () => requestAnimationFrame(calc)
    window.addEventListener('resize', onAny)
    window.addEventListener('scroll', onAny, true)
    return () => {
      window.removeEventListener('resize', onAny)
      window.removeEventListener('scroll', onAny, true)
    }
  }, [open, q])

  async function startChat(peerId: string) {
    if (busyId) return
    setBusyId(peerId)
    try {
      const res = await fetch(`/api/dm/open?peerId=${encodeURIComponent(peerId)}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.threadId) {
        setOpen(false)
        router.push(`/messages/${j.threadId}`)
        router.refresh()
        window.dispatchEvent(new CustomEvent('dm:changed'))
      }
    } finally {
      setBusyId(null)
    }
  }

  const Action = useMemo(() => (u: UserLite) => {
    if (sets.friends.has(u.id)) {
      const pending = busyId === u.id
      return (
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 whitespace-nowrap pr-2">
          <span className="rounded-full bg-gray-100 text-gray-700 px-3 h-7 inline-grid place-items-center text-[11px] font-semibold">
            Book Buddy
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => startChat(u.id)}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-primary text-white h-7 px-2 sm:px-3 text-[12px] font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            <svg className="sm:mr-1" width="14" height="14" viewBox="0 0 24 24"><path d="M4 6h16v12H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M22 6l-10 7L2 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            <span className="hidden sm:inline">{pending ? 'Açılıyor…' : 'Mesaj Gönder'}</span>
          </button>
        </div>
      )
    }
    if (sets.outgoing.has(u.id)) {
      return <span className="shrink-0 rounded-full px-3 h-7 inline-grid place-items-center text-[11px] font-semibold bg-amber-100 text-amber-700">Beklemede</span>
    }
    if (sets.incoming.has(u.id)) {
      return (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => acceptIncoming(u.id)}
          className="shrink-0 rounded-full px-3 h-7 text-[12px] font-semibold bg-primary text-white hover:bg-primary/90"
        >
          Kabul Et
        </button>
      )
    }
    return (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => addFriend(u.id)}
        className="shrink-0 rounded-full px-3 h-7 text-[12px] font-semibold bg-primary text-white hover:bg-primary/90"
      >
        Ekle
      </button>
    )
  }, [sets, addFriend, acceptIncoming, busyId])

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? 'Book Buddy Bul'}
        className={inputShell}
        aria-label={placeholder ?? 'Book Buddy Bul'}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && box && createPortal(
        <div
          className="z-50 rounded-xl border border-black/10 bg-white text-gray-900 shadow-lg"
          style={{ position: 'fixed', top: box.top, left: box.left, width: box.width, maxHeight: '60vh', overflowY: 'auto' }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading && <div className="px-4 py-3 text-sm text-gray-500">Yükleniyor…</div>}
          {!loading && suggestions.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">Sonuç yok</div>}
          {!loading && suggestions.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
              <Link href={userPath(u.username, u.name, u.slug)} className="flex items-center gap-3 min-w-0 flex-1">
                <img src={u.avatarUrl || '/avatar.png'} alt={u.name || 'Avatar'} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{u.name || 'Kullanıcı'}</div>
                  <div className="truncate text-xs text-gray-500">{u.username ? `@${u.username}` : u.slug ? `@${u.slug}` : ''}</div>
                </div>
              </Link>
              {sets.incoming.has(u.id) && (
                <span className="hidden sm:inline-block rounded-full bg-blue-50 text-blue-700 px-3 h-7 inline-grid place-items-center text-[11px] font-semibold">
                  İstek
                </span>
              )}
              <Action {...u} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
