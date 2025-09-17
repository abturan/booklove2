'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import Image from 'next/image';

export default function Header() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (href: string) =>
    pathname === href ? 'text-rose-600' : 'text-gray-700'

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
    <header
      className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur
                 supports-backdrop-blur:bg-white/60 "
    >
      <div className="container  mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          <Image
            src="/logo-fixed.svg"
            alt="boook.love"
            width={200}
            height={32}
            priority
            className="rounded-md logo-main-page"
          />
        </Link>

        <div className="flex items-center gap-2 header-buttons-container">
          {status === 'loading' && (
            <div className="h-8 w-28 rounded-full bg-gray-200 animate-pulse" />
          )}

          {status === 'unauthenticated' && (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm "
              >
                Giriş yap
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-sm"
              >
                Kayıt ol
              </Link>
            </>
          )}

          {status === 'authenticated' && (
            <>
              <Link
                href="/profile/settings"
                className={`px-3 py-1.5 rounded-full bg-gray-100 text-sm ${isActive('/profile/settings')}`}
              >
                Profilim
              </Link>
              <button
                disabled={signingOut}
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm disabled:opacity-50"
              >
                {signingOut ? 'Çıkış yapılıyor…' : 'Çıkış'}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
