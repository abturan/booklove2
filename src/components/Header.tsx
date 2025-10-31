// src/components/Header.tsx
'use client'

import HeaderLogo from '@/components/header/HeaderLogo'
import UserMenu from '@/components/header/UserMenu'
import AuthButtons from '@/components/header/AuthButtons'
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

      <header className="hidden md:block sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-backdrop-blur:bg-white/70">
        <div className="container mx-auto mt-2 flex h-14 items-center justify-between px-4">
          <HeaderLogo compact={!isHome} size={!isHome ? 140 : undefined} />
          <div className="hidden md:block">{isGuest ? <AuthButtons /> : <UserMenu />}</div>
          <div className="md:hidden">{isGuest ? <AuthButtons /> : null}</div>
        </div>
      </header>
    </>
  )
}
