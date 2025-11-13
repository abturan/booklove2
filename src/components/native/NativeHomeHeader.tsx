// src/components/native/NativeHomeHeader.tsx
'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import Avatar from '@/components/Avatar'
import { useAuth } from '@/components/friends/hooks/useAuth'
import { useBuddyPanelLists } from '@/components/friends/hooks/useBuddyPanelLists'

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 10a6 6 0 1 1 12 0v3l1.5 2.5H4.5L6 13z" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M9 19a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  )
}
function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M5 12a7 7 0 0 0 14 0M12 19v3" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  )
}

export default function NativeHomeHeader() {
  const { authed } = useAuth()
  const { mutual, following } = useBuddyPanelLists(Boolean(authed))

  const items = useMemo(() => {
    const list = [...mutual, ...following]
    const seen = new Set<string>()
    const ordered: { id: string; name: string | null; slug: string | null; username: string | null; avatarUrl: string | null }[] = []
    list.forEach((u) => { if (!u.id || seen.has(u.id)) return; seen.add(u.id); ordered.push(u) })
    return ordered.slice(0, 10)
  }, [mutual, following])

  return (
    <section className="px-4">
      {/* Top capsule bar */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#5c60ff] via-[#7a4fff] to-[#c252ff] p-4 text-white shadow-[0_20px_60px_rgba(98,74,255,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">Speak</span>
            <span className="rounded-full bg-[#ffd23a] px-2.5 py-0.5 text-[11px] font-extrabold text-[#251200] shadow-sm">UP!</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="grid h-9 w-9 place-content-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
              <IconSearch />
            </button>
            <button type="button" className="relative grid h-9 w-9 place-content-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
              <IconBell />
              <span className="absolute -top-0.5 -right-0.5 inline-block h-3.5 min-w-[14px] rounded-full bg-[#ffd23a] px-1 text-center text-[10px] font-bold text-[#251200]">3</span>
            </button>
            <button type="button" className="grid h-9 w-9 place-content-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
              <IconMic />
            </button>
          </div>
        </div>
      </div>

      {/* Stories / live avatars */}
      {items.length > 0 && (
        <div className="mt-3 no-scrollbar flex gap-4 overflow-x-auto py-1">
          {items.map((user, idx) => (
            <Link
              key={user.id}
              href={user.slug ? `/u/${user.slug}` : user.username ? `/u/${user.username}` : '#'}
              className="relative flex flex-col items-center gap-1 text-center text-[11px] text-white/90"
            >
              <span className="relative rounded-full bg-gradient-to-br from-[#ffea7f] via-[#ffb86a] to-[#ff6a88] p-[3px]">
                <Avatar src={user.avatarUrl ?? undefined} size={56} alt={user.name || 'Kullanıcı'} className="ring-0" />
                {idx < 3 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-[#ffd23a] px-1.5 py-0.5 text-[9px] font-bold text-[#2c0d00] ring-1 ring-white/40">LIVE</span>
                )}
              </span>
              <span className="max-w-[80px] truncate">{user.name || user.username || 'Kullanıcı'}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Now Playing hero card */}
      <div className="mt-3 overflow-hidden rounded-[26px] bg-[#120a23] shadow-[0_20px_55px_rgba(34,18,58,0.6)]">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/banners/banner3.png" alt="" className="h-44 w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#221041]/70 via-[#1a0e2f]/60 to-transparent" />
          <div className="absolute inset-0 p-4">
            <div className="text-[11px] tracking-[0.3em] text-white/70">ŞİMDİ YAYINDA</div>
            <h3 className="mt-1 text-2xl font-bold leading-tight text-white">Müzisyen Canlı</h3>
            <div className="mt-2 flex items-center justify-between text-white/85">
              <div className="flex items-center -space-x-2">
                <Avatar src={items[0]?.avatarUrl ?? undefined} size={24} alt="Dinleyici" />
                <Avatar src={items[1]?.avatarUrl ?? undefined} size={24} alt="Dinleyici" />
                <Avatar src={items[2]?.avatarUrl ?? undefined} size={24} alt="Dinleyici" />
              </div>
              <div className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">1.9K dinleyici</div>
            </div>
            <div className="absolute bottom-3 right-3">
              <button type="button" className="rounded-full bg-gradient-to-r from-[#6f7cff] to-[#a972ff] px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                Katıl
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

