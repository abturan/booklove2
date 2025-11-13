// src/components/header/HeaderLogo.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useDockedLogo } from './useDockedLogo'

type Props = {
  compact?: boolean
  size?: number
  className?: string
}

export default function HeaderLogo({ compact = false, size, className }: Props = {}) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const dockedLogo = useDockedLogo()
  const visible = isHome ? dockedLogo : true
  const computedSize = size ?? (compact ? 80 : 140)

  const baseClass = clsx(
    'transition-all duration-200',
    compact ? 'h-auto w-auto' : 'rounded-md logo-main-page1 mt-[36px] lg:mt-[60px] w-[50%]',
    className
  )

  return (
    <Link href="/" className="font-semibold" aria-label="book.love">
      <img
        src="/logo-fixed.svg"
        alt="book.love"
        width={computedSize}
        height={computedSize * 0.25}
        className={baseClass}
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
