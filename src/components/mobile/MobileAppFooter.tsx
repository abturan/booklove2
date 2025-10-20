// src/components/mobile/MobileAppFooter.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import NotificationBadge from '@/components/NotificationBadge'

function IClubs() { return (<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 7h16M6 11h12M8 15h8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>) }
function IBookie() { return (<svg width="26" height="26" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.8"/></svg>) }
function IPlus() { return (<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>) }
function IBuddy() { return (<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3.5 20c0-3.5 3.5-5.5 6.5-5.5M14 14.5c3.5 0 6.5 2 6.5 5.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>) }
function IMessages() { return (<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/></svg>) }
function ISettings() { return (<svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3 12h3M18 12h3M12 3v3M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>) }
function ICreateClub() { return (<svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 6h10a3 3 0 0 1 3 3v9H5z" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M8 9h7M12 12v6M9 15h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>) }

export default function MobileAppFooter() {
  const [openSettings, setOpenSettings] = useState(false)
  const [profileHref, setProfileHref] = useState<string>('/profile/settings')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' })
        const me = await res.json()
        if (res.ok && (me?.username || me?.name)) {
          const u = typeof me.username === 'string' && me.username.trim().length > 0 ? me.username : (me.name || '').trim().toLowerCase().replace(/\s+/g, '-')
          setProfileHref(`/u/${u}`)
        }
      } catch {}
    })()
  }, [])

  function openShare() {
    window.dispatchEvent(new CustomEvent('share:open'))
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t">
        <div className="grid grid-cols-7 items-center px-2 py-2 text-primary">
          <Link href="/?tab=clubs" scroll={false} className="grid place-content-center h-12">
            <IClubs />
          </Link>
          <Link href="/friends" scroll={false} className="relative grid place-content-center h-12">
            <IBuddy />
            <NotificationBadge placement="absolute -top-1 -right-1" />
          </Link>
          <Link href="/?tab=bookie" scroll={false} className="grid place-content-center h-12">
            <IBookie />
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
          <Link href="/messages" scroll={false} className="grid place-content-center h-12">
            <IMessages />
          </Link>
          <Link href="/clubs/create" scroll={false} className="grid place-content-center h-12">
            <ICreateClub />
          </Link>
          <button
            type="button"
            onClick={() => setOpenSettings(true)}
            className="grid place-content-center h-12"
            aria-label="Ayarlar"
            title="Ayarlar"
          >
            <ISettings />
          </button>
        </div>
      </nav>

      {openSettings && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpenSettings(false)} />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white shadow-xl p-2">
            <div className="grid grid-cols-4 gap-2 text-sm">
              <Link href={profileHref} scroll={false} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M4 20c0-4.5 4-7 8-7s8 2.5 8 7" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>
                <span>Profil</span>
              </Link>
              <Link href="/subscriptions" scroll={false} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary"><path d="M5 7h14v10H5z" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M8 10h8M8 14h6" stroke="currentColor" strokeWidth="1.8"/></svg>
                <span>Abonelikler</span>
              </Link>
              <Link href="/profile/settings" scroll={false} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary"><path d="M12 8a4 4 0 1 0 0 8" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3 12h3M18 12h3M12 3v3M12 18v3" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>
                <span>Ayarlar</span>
              </Link>
              <a href="/api/auth/signout" className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50">
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary"><path d="M9 5h6v14H9" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M13 12H3m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                <span>Çıkış yap</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
