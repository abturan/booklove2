// src/components/header/UserMenu.tsx
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Avatar from '@/components/Avatar'
import { useMe } from './useMe'
import useNotificationCount from '@/lib/hooks/useNotificationCount'
import AuthButtons from './AuthButtons'

const IProfile = () => (<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>)
const ISubs    = () => (<svg width="18" height="18" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M7 10h10M7 14h7" stroke="currentColor" strokeWidth="1.8"/></svg>)
const IBuddy   = () => (<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3.5 20c0-3.5 3.5-5.5 6.5-5.5M14 14.5c3.5 0 6.5 2 6.5 5.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>)
const IMessages= () => (<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/></svg>)
const ILogout  = () => (<svg width="18" height="18" viewBox="0 0 24 24"><path d="M9 5h6v14H9" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M13 12H3m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>)

function Dot({ show, className = '' }: { show: boolean; className?: string }) {
  if (!show) return null
  return <span className={`inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_2px_white] ${className}`} />
}

export default function UserMenu() {
  const { status } = useSession()
  const { me, loaded } = useMe()
  const router = useRouter()
  const [menu, setMenu] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [dmUnread, setDmUnread] = useState(0)
  const [followRequests, setFollowRequests] = useState(0)
  const { count: notifUnread } = useNotificationCount()

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [dmRes, frRes] = await Promise.all([
          fetch('/api/dm/unread-counts', { cache: 'no-store' }),
          fetch('/api/friends/pending/count', { cache: 'no-store' }),
        ])
        const dm = await dmRes.json().catch(() => null)
        const fr = await frRes.json().catch(() => null)
        if (alive) {
          if (dmRes.ok) setDmUnread(Number(dm?.total || 0))
          if (frRes.ok) setFollowRequests(Number(fr?.count ?? fr?.total ?? 0))
        }
      } catch {}
    }
    load()
    const t = setInterval(load, 20_000)
    const h = () => load()
    window.addEventListener('dm:changed', h)
    window.addEventListener('dm:counts', h)
    window.addEventListener('friends:changed', h)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener('dm:changed', h)
      window.removeEventListener('dm:counts', h)
      window.removeEventListener('friends:changed', h)
    }
  }, [])

  if (status !== 'authenticated') return <AuthButtons />

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut({ redirect: false })
      router.push('/', { scroll: false })
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const totalBadge = dmUnread + followRequests + notifUnread

  return (
    <div className="relative">
      <button
        onClick={() => setMenu((v) => !v)}
        className="relative inline-flex items-center justify-center"
        title="Menü"
      >
        {loaded && <Avatar src={me?.avatarUrl ?? null} size={36} alt="Profil" />}
        <Dot show={totalBadge > 0} className="absolute -top-1 -right-1 z-10" />
      </button>

      {menu && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden"
          onMouseLeave={() => setMenu(false)}
        >
          <Link
            href={me?.slug ? `/u/${me.slug}` : '/profile/settings'}
            scroll={false}
            className="flex items-center justify-between px-3 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary/90"
          >
            <span className="inline-flex items-center gap-2">
              <IProfile />
              Profilime git
            </span>
          </Link>

          <Link href="/profile/settings" scroll={false} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
            <span className="inline-flex items-center gap-2"><IProfile /> Profil ayarları</span>
          </Link>

          <Link href="/subscriptions" scroll={false} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
            <span className="inline-flex items-center gap-2"><ISubs /> Abonelikler</span>
          </Link>

          <Link href="/friends" scroll={false} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
            <span className="inline-flex items-center gap-2"><IBuddy /> Book Buddy</span>
            <Dot show={followRequests > 0} />
          </Link>

          <Link href="/messages" scroll={false} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
            <span className="inline-flex items-center gap-2"><IMessages /> Mesajlar</span>
            <Dot show={dmUnread > 0} />
          </Link>

          <Link href="/notifications" scroll={false} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50">
            <span className="inline-flex items-center gap-2"><IMessages /> Bildirimler</span>
            <Dot show={notifUnread > 0} />
          </Link>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2"><ILogout /> {signingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
