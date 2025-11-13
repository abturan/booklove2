// src/components/Header.tsx
'use client'

import { Suspense } from 'react'
import HeaderLogo from '@/components/header/HeaderLogo'
import UserMenu from '@/components/header/UserMenu'
import AuthButtons from '@/components/header/AuthButtons'
import SearchFilters from '@/components/SearchFilters'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { status } = useSession()
  const isGuest = status !== 'authenticated'
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 h-1 bg-[#fa3d30] md:hidden" />

      <header className="hidden md:block sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-[#fa3d30] via-[#ff5b4a] to-[#ff9660] text-white backdrop-blur supports-backdrop-blur:bg-[#fa3d30]/90 shadow-lg">
        <div className="container relative mx-auto flex h-[60px] items-center gap-3 overflow-hidden rounded-3xl px-4">
          <div className="pointer-events-none absolute inset-0 opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 60%)' }} />

          <div className="relative flex items-center gap-2">
            <HeaderLogo compact size={70} />
            <div className="hidden xl:flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/85">
              <span>Okurlar</span>
              <span className="h-px w-10 bg-white/60" />
              <span>Birleşiyor</span>
            </div>
          </div>

          <div className="relative flex flex-1 justify-center">
            <Suspense fallback={<div className="h-9 w-full max-w-[460px]" />}>
              <SearchFilters variant="compact" className="w-full" />
            </Suspense>
          </div>

          <div className="relative flex flex-none items-center gap-3">
            <div className="hidden md:block">{isGuest ? <AuthButtons /> : <UserMenu />}</div>
          </div>
        </div>
      </header>
    </>
  )
}
