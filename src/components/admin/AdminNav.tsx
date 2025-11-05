// src/components/admin/AdminNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const items = [
  { href: '/admin', label: 'Özet' },
  { href: '/admin/clubs', label: 'Kulüpler' },
  { href: '/admin/members', label: 'Üyeler' },
  { href: '/admin/payments', label: 'Ödemeler' },
  { href: '/admin/posts', label: 'Post’lar' },
  { href: '/admin/ads', label: 'Reklamlar' },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-2 overflow-x-auto whitespace-nowrap rounded-xl border px-2 py-1 sm:border-0 sm:px-0 sm:py-0 flex-wrap">
      {items.map(i => (
        <Link
          key={i.href}
          href={i.href}
          className={clsx(
            'rounded-full px-3 py-1.5 text-sm shrink-0',
            pathname === i.href
              ? 'bg-primary text-white'
              : 'bg-white border border-slate-200 hover:bg-gray-50'
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
