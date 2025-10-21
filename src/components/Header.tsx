// src/components/Header.tsx
'use client'

import HeaderLogo from '@/components/header/HeaderLogo'
import UserMenu from '@/components/header/UserMenu'
import AuthButtons from '@/components/header/AuthButtons'
import { useSession } from 'next-auth/react'

export default function Header() {
  const { status } = useSession()
  const isGuest = status !== 'authenticated'

  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-backdrop-blur:bg-white/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between mt-2">
        <HeaderLogo />
        <div className="hidden md:block">
          <UserMenu />
        </div>
        <div className="md:hidden">
          {isGuest ? <AuthButtons /> : null}
        </div>
      </div>
    </header>
  )
}






