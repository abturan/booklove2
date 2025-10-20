// src/components/clubs/ClubCard.tsx
'use client'

import Link from 'next/link'

export default function ClubCard({
  club,
}: {
  club: { id: string; slug: string; name: string; description?: string | null; bannerUrl?: string | null }
}) {
  return (
    <Link href={`/c/${club.slug}`} className="card overflow-hidden block">
      <div className="h-28 bg-gray-100" style={{ backgroundImage: `url(${club.bannerUrl || ''})`, backgroundSize: 'cover' }} />
      <div className="p-4">
        <div className="font-semibold">{club.name}</div>
        {club.description && <div className="text-sm text-gray-600 line-clamp-2 mt-1">{club.description}</div>}
      </div>
    </Link>
  )
}
