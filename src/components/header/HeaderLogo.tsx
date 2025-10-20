// src/components/header/HeaderLogo.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDockedLogo } from './useDockedLogo'

export default function HeaderLogo() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const dockedLogo = useDockedLogo()
  const visible = isHome ? dockedLogo : true
  const cls = isHome ? 'rounded-md logo-main-page1 mt-[36px] lg:mt-[60px] w-[50%]' : 'mt-[36px] lg:mt-[60px] w-[50%]'

  return (
    <Link href="/" className="font-semibold" aria-label="boook.love">
      <img
        src="/logo-fixed.svg"
        alt="boook.love"
        width={200}
        height={32}
        className={cls}
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${visible ? 0 : -6}px)`,
          transition: 'opacity 220ms ease, transform 220ms ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      />
    </Link>
  )
}
