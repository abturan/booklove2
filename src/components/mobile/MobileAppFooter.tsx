// src/components/mobile/MobileAppFooter.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import NotificationBadge from '@/components/NotificationBadge'
import useNotificationCount from '@/lib/hooks/useNotificationCount'
import Avatar from '@/components/Avatar'

function IClubs() { return (<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 7h16M6 11h12M8 15h8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>) }
function IBookie() { return (<svg width="26" height="26" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.8"/></svg>) }
function IPlus() { return (<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>) }
function IBuddy() { return (<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3.5 20c0-3.5 3.5-5.5 6.5-5.5M14 14.5c3.5 0 6.5 2 6.5 5.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>) }
function IMessages() { return (<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/></svg>) }
function ISubscriptions() { return (<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M7 10h10M7 14h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>) }
function ICreateClub() { return (<svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 6h10a3 3 0 0 1 3 3v9H5z" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>) }
function ILogin() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <path d="M12 5h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="m12 16 4-4-4-4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 12H4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}
function IRegister() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <path d="M6 19c0-3.5 3-5.5 6-5.5s6 2 6 5.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M18 8v3M16.5 9.5h3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function MobileAppFooter() {
  const router = useRouter()
  const { status } = useSession()
  const isAuth = status === 'authenticated'

  const navRef = useRef<HTMLElement | null>(null)

  const [openSettings, setOpenSettings] = useState(false)
  const [profileHref, setProfileHref] = useState<string>('/profile/settings')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('Profil')
  const [dmUnread, setDmUnread] = useState(0)
  const { count: notifUnread } = useNotificationCount()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!isAuth) return
    ;(async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        const me = await res.json()
        if (res.ok) {
          const u =
            typeof me?.username === 'string' && me.username.trim()
              ? me.username
              : (me?.name || '').trim().toLowerCase().replace(/\s+/g, '-')
          setProfileHref(me?.username || me?.name ? `/u/${u}` : '/profile/settings')
          setAvatarUrl(me?.avatarUrl ?? null)
          setDisplayName(me?.name || 'Profil')
        }
      } catch {}
    })()
  }, [isAuth])

  useEffect(() => {
    if (!isAuth) { setDmUnread(0); return }
    let alive = true
    async function loadCounts() {
      try {
        const res = await fetch('/api/dm/unread-counts', { cache: 'no-store' })
        const j = await res.json().catch(() => null)
        if (alive && res.ok) setDmUnread(Number(j?.total || 0))
      } catch {}
    }
    loadCounts()
    const t = setInterval(loadCounts, 20_000)
    const h = () => loadCounts()
    window.addEventListener('dm:changed', h)
    window.addEventListener('dm:counts', h)
    return () => {
      alive = false
      clearInterval(t)
      window.removeEventListener('dm:changed', h)
      window.removeEventListener('dm:counts', h)
    }
  }, [isAuth])

  function openShare() {
    window.dispatchEvent(new CustomEvent('share:open'))
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut({ redirect: false })
      setOpenSettings(false)
      router.push('/', { scroll: false })
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const win = window as Window
    const el = navRef.current
    if (!el) return

    const applyHeight = (h: number) => {
      document.documentElement.style.setProperty('--mobile-footer-height', `${h}px`)
    }

    const measure = () => {
      const rect = el.getBoundingClientRect()
      applyHeight(rect.height)
    }

    measure()

    if ('ResizeObserver' in win) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) applyHeight(entry.contentRect.height)
      })
      observer.observe(el)
      return () => observer.disconnect()
    }

    const handler = () => measure()
    win.addEventListener('resize', handler)
    return () => win.removeEventListener('resize', handler)
  }, [])

  return (
    <>
      <nav data-mobile-footer ref={navRef} className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t">
        <div className={`${isAuth ? 'grid-cols-7' : 'grid-cols-4'} grid items-center px-2 py-2 text-primary gap-2`}>
          {isAuth ? (
            <>
             
              <Link href="/?tab=bookie" scroll={false} className="grid place-content-center h-12" aria-label="Bookie">
                <IBookie />
              </Link>
               <Link href="/?tab=clubs" scroll={false} className="grid place-content-center h-12" aria-label="Kulüpler">
                <IClubs />
              </Link>
              <Link href="/?tab=buddy" scroll={false} className="relative grid place-content-center h-12" aria-label="Buddy">
                <IBuddy />
                <NotificationBadge placement="absolute top-0 right-0 -translate-x-1/4 translate-y-1/4" />
              </Link>
              <button
                type="button"
                onClick={openShare}
                className="grid place-content-center -mt-6"
                aria-label="Paylaşım Yap"
                title="Paylaşım Yap"
              >
                <div className="h-12 w-12 rounded-full bg-primary text-white grid place-content-center shadow">
                  <IPlus />
                </div>
              </button>
              <Link href="/messages" scroll={false} className="relative grid place-content-center h-12" aria-label="Mesajlar">
                <IMessages />
                {dmUnread + notifUnread > 0 && (
                  <span className="absolute top-0 right-0 -translate-x-1/4 translate-y-1/4 inline-block h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_2px_white]" />
                )}
              </Link>
              <Link href="/subscriptions" scroll={false} className="grid place-content-center h-12" aria-label="Kulüplerim">
                <ISubscriptions />
              </Link>
              <button
                type="button"
                onClick={() => setOpenSettings(true)}
                className="grid place-content-center h-12"
                aria-label="Profil"
                title={displayName}
              >
                <Avatar src={avatarUrl} size={28} alt={displayName} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/?tab=clubs"
                scroll={false}
                className="flex h-12 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none text-primary"
              >
                <IClubs />
                <span>Kulüpler</span>
              </Link>
              <Link
                href="/?tab=bookie"
                scroll={false}
                className="flex h-12 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none text-primary"
              >
                <IBookie />
                <span>Bookie!</span>
              </Link>
              <Link
                href="/login"
                scroll={false}
                className="flex h-12 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none text-primary"
              >
                <ILogin />
                <span>Giriş</span>
              </Link>
              <Link
                href="/register"
                scroll={false}
                className="flex h-12 flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none text-primary"
              >
                <IRegister />
                <span>Kayıt</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {isAuth && openSettings && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpenSettings(false)} />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white shadow-xl p-2">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Link href={profileHref} scroll={false} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <Avatar src={avatarUrl} size={24} alt={displayName} />
                <span>Profil</span>
              </Link>
              {/* <Link href="/clubs/create" scroll={false} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <ICreateClub />
                <span>Kulüp Kur</span>
              </Link> */}
              <Link href="/profile/settings" scroll={false} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary"><path d="M12 8a4 4 0 1 0 0 8" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3 12h3M18 12h3M12 3v3M12 18v3" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>
                <span>Ayarlar</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 disabled:opacity-60"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary"><path d="M9 5h6v14H9" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M13 12H3m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                <span>{signingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
