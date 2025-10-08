// src/components/ShortcutCard.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Ana akış', icon: '🏠' },
  { href: '/profile/settings', label: 'Profil ayarları', icon: '⚙️' },
  { href: '/subscriptions', label: 'Aboneliklerim', icon: '📚' },
  { href: '/friends', label: 'Book Buddy', icon: '🧑‍🤝‍🧑' }, // <- burada “Book Buddy”
  { href: '/messages', label: 'Mesajlar', icon: '💬' },
]

export default function ShortcutCard() {
  const pathname = usePathname()
  return (
    <div className="card p-0 overflow-hidden">
      <div className="divide-y">
        {items.map((it) => {
          const active = pathname === it.href
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition ${
                active ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg leading-none">{it.icon}</span>
                <span className="text-sm">{it.label}</span>
              </div>
              <span className="text-gray-300">›</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
