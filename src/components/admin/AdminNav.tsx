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
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-2">
      {items.map(i => (
        <Link
          key={i.href}
          href={i.href}
          className={clsx(
            'rounded-full px-3 py-1.5 text-sm',
            pathname === i.href
              ? 'bg-primary text-white'
              : 'bg-white ring-1 ring-black/10 hover:bg-gray-50'
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
