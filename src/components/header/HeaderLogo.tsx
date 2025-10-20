// src/components/header/HeaderLogo.tsx
'use client'

import Link from 'next/link'
import { useDockedLogo } from './useDockedLogo'

export default function HeaderLogo() {
  const dockedLogo = useDockedLogo()
  return (
    <Link href="/" className="font-semibold" aria-label="boook.love">
      <img
        src="/logo-fixed.svg"
        alt="boook.love"
        width={200}
        height={32}
        className="rounded-md logo-main-page1 mt-[36px] lg:mt-[60px] w-[50%]"
        style={{
          opacity: dockedLogo ? 1 : 0,
          transform: `translateY(${dockedLogo ? 0 : -6}px)`,
          transition: 'opacity 220ms ease, transform 220ms ease',
          pointerEvents: dockedLogo ? 'auto' : 'none',
        }}
      />
    </Link>
  )
}
