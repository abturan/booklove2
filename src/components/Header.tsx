'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (href: string) =>
    pathname === href ? 'text-rose-600' : 'text-gray-700'

  return (
    <header className="border-b bg-white/70 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link className={isActive('/')} href="/">Ana sayfa</Link>
          <Link className={isActive('/clubs')} href="/clubs">Kulüpler</Link>
        </nav>

        <div className="flex items-center gap-2">
          {status === 'loading' && (
            <div className="h-8 w-28 rounded-full bg-gray-200 animate-pulse" />
          )}

          {status === 'unauthenticated' && (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm"
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
                className="px-3 py-1.5 rounded-full bg-gray-100 text-sm"
              >
                Profilim
              </Link>
              <button
                disabled={signingOut}
                onClick={async () => {
                  setSigningOut(true)
                  await signOut({ callbackUrl: '/' })
                }}
                className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm disabled:opacity-50"
              >
                Çıkış
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
