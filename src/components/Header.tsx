// src/components/Header.tsx
'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
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
  const [isHidden, setIsHidden] = useState(false)
  const lastScrollY = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      if (rafRef.current) return
      rafRef.current = window.requestAnimationFrame(() => {
        const current = window.scrollY
        const goingDown = current > lastScrollY.current + 4
        const goingUp = current < lastScrollY.current - 4
        const nearTop = current < 24

        if (nearTop || goingUp) {
          setIsHidden(false)
        } else if (goingDown) {
          setIsHidden(true)
        }

        lastScrollY.current = current
        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const headerClass = clsx(
    'sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-[#fa3d30] via-[#ff5b4a] to-[#ff9660] text-white backdrop-blur supports-backdrop-blur:bg-[#fa3d30]/90 shadow-lg transition-all duration-300 ease-out will-change-transform',
    isHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
  )
  const showSearch = pathname === '/'

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 h-1 bg-[#fa3d30] md:hidden" />

      <header className={headerClass}>
        <div className="container relative mx-auto flex h-[60px] items-center gap-3 overflow-visible rounded-3xl px-4">
          <div className="pointer-events-none absolute inset-0 opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 60%)' }} />
          <div className="flex w-full items-center justify-between md:hidden">
            <HeaderLogo compact size={52} />
            <div className="flex items-center gap-2">
              {isGuest ? <AuthButtons /> : <UserMenu />}
            </div>
          </div>

          <div className="relative hidden md:flex flex-shrink-0 items-center">
            <div className="flex items-center">
              <HeaderLogo compact size={80} />
              
            </div>
            <div aria-hidden style={{ width: 30 }} />
            <div className="hidden xl:flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/85">
              <span>Okurlar</span>
              <span className="h-px w-10 bg-white/60" />
              <span>Birleşiyor</span>
            </div>
            <div aria-hidden className="hidden xl:block" style={{ width: 30 }} />
          </div>

          {showSearch ? (
            <div className="relative hidden md:flex flex-1 min-w-0 justify-center z-50">
              <Suspense fallback={<div className="h-9 w-full max-w-[460px]" />}>
                <SearchFilters variant="compact" className="w-full" />
              </Suspense>
            </div>
          ) : (
            <div className="hidden md:block flex-1" />
          )}

          <div className="relative hidden md:flex flex-none items-center gap-3 z-50">
            <div className="hidden md:block">{isGuest ? <AuthButtons /> : <UserMenu />}</div>
          </div>
        </div>
      </header>
    </>
  )
}
