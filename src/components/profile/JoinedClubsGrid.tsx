// src/components/profile/JoinedClubsGrid.tsx
'use client'

import Link from 'next/link'

type Item = {
  id: string
  slug: string
  name: string
  imageUrl?: string | null
  members: number
  picks: number
  events: number
}

export default function JoinedClubsGrid({ items }: { items: Item[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="card p-4">
        <div className="text-xl font-semibold mb-2">Üye Olduğu Kulüpler</div>
        <div className="text-sm text-gray-600">Henüz kulüp yok.</div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="text-xl font-semibold mb-3">Üye Olduğu Kulüpler</div>

      <ul className="grid grid-cols-2 gap-4 sm:gap-5">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/clubs/${c.slug}`}
              className="group block rounded-2xl border bg-white p-3 text-center hover:shadow-sm"
            >
              <div className="mx-auto mb-2 h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl || '/images/club-fallback.png'}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="text-sm font-medium group-hover:underline">
                {c.name}
              </div>

              <div className="mt-1 flex items-center justify-center gap-3 text-xs text-gray-600">
                <span title="Üye sayısı">👥 {c.members}</span>
                <span title="Seçki sayısı">📚 {c.picks}</span>
                <span title="Oturum sayısı">🗓️ {c.events}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
