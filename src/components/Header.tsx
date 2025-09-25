// src/components/Header.tsx
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'

type MeLite = { id: string; avatarUrl: string | null }

export default function Header() {
  const { status } = useSession()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [menu, setMenu] = useState(false)

  const [me, setMe] = useState<MeLite | null>(null)
  const [loaded, setLoaded] = useState(false)

  async function fetchMe() {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      if (!res.ok) throw new Error('me-failed')
      const j = (await res.json()) as MeLite
      setMe(j)
    } catch {
      setMe(null)
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') fetchMe()
  }, [status])

  useEffect(() => {
    const onUpdated = () => fetchMe()
    window.addEventListener('me:updated', onUpdated)
    return () => window.removeEventListener('me:updated', onUpdated)
  }, [])

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut({ redirect: false })
      router.push('/')
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-backdrop-blur:bg-white/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          <img
            src="/logo-fixed.svg"
            alt="boook.love"
            width={200}
            height={32}
            className="rounded-md logo-main-page1 mt-[36px] lg:mt-[60px] w-[50%]"
          />
        </Link>

        {status === 'authenticated' ? (
          <div className="relative">
            <button
              onClick={() => setMenu((v) => !v)}
              className="inline-flex items-center justify-center"
              title="Menü"
            >
              {loaded && <Avatar src={me?.avatarUrl ?? null} size={36} alt="Profil" />}
            </button>
            {menu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg overflow-hidden"
                onMouseLeave={() => setMenu(false)}
              >
                <Link href="/feed" className="block px-3 py-2 text-sm hover:bg-gray-50">Akış</Link>
                <Link href="/profile/settings" className="block px-3 py-2 text-sm hover:bg-gray-50">Profil ayarları</Link>
                <Link href="/subscriptions" className="block px-3 py-2 text-sm hover:bg-gray-50">Abonelikler</Link>
                <Link href="/friends" className="block px-3 py-2 text-sm hover:bg-gray-50">Arkadaşlar</Link>
                <Link href="/messages" className="block px-3 py-2 text-sm hover:bg-gray-50">Mesajlar</Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {signingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm ">
              Giriş yap
            </Link>
            <Link href="/register" className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-sm">
              Kayıt ol
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
