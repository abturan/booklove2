// src/components/Header.tsx
'use client'

import HeaderLogo from '@/components/header/HeaderLogo'
import UserMenu from '@/components/header/UserMenu'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-backdrop-blur:bg-white/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between mt-2">
        <HeaderLogo />
        {/* Mobilde gizli, md ve üstünde görünsün */}
        <div className="hidden md:block">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
