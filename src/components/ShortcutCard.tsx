// src/components/ShortcutCard.tsx
'use client'

import Link from 'next/link'

type Item = { href: string; label: string; icon: string }

const items: Item[] = [
  { href: '/feed',              label: 'Ana akış',       icon: '🏠' },
  { href: '/profile/settings',  label: 'Profil ayarları',icon: '⚙️' },
  { href: '/subscriptions',     label: 'Aboneliklerim',  icon: '📚' },
  { href: '/friends',           label: 'Arkadaşlar',     icon: '👥' },
  // ⬇️ YENİ
  { href: '/messages',          label: 'Mesajlar',       icon: '💬' },
]

export default function ShortcutCard() {
  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-3">Kısayollar</h3>
      <ul className="divide-y divide-gray-100">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl leading-none">{it.icon}</span>
                <span>{it.label}</span>
              </span>
              <span className="text-gray-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
