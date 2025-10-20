// src/components/clubs/ModeratorClubCard.tsx
'use client'

import Link from 'next/link'

export default function ModeratorClubCard({
  club,
}: {
  club: { id: string; slug: string; name: string; bannerUrl?: string | null }
}) {
  // Bu kart zaten yalnızca published kulüpler için çağrılıyor (sayfada filtreledik)
  return (
    <Link href={`/c/${club.slug}`} className="card overflow-hidden block">
      <div className="h-24 bg-gray-100" style={{ backgroundImage: `url(${club.bannerUrl || ''})`, backgroundSize: 'cover' }} />
      <div className="p-4 font-semibold">{club.name}</div>
    </Link>
  )
}
