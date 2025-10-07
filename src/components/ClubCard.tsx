// src/components/ClubCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type ClubItem = {
  id: string
  slug: string
  name: string
  description: string | null
  bannerUrl: string | null
  priceTRY: number
  moderator?: { id: string; name: string; avatarUrl?: string | null; username?: string | null } | null
  memberCount: number
  pickCount: number
}

export default function ClubCard({ club }: { club: ClubItem }) {
  const moderatorName = club.moderator?.name ?? 'Moderatör'
  const moderatorAvatar = club.moderator?.avatarUrl || null
  const cover =
    club.bannerUrl ??
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop'

  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5',
        'transition hover:shadow-md'
      )}
    >
      <Link href={`/clubs/${club.slug}`} className="block">
        <div className="relative h-41 w-full overflow-hidden">
          <Image
            src={cover}
            alt={club.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 34vw"
            priority={false}
          />
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/clubs/${club.slug}`}>
          <h3 className="text-base font-semibold tracking-tight text-gray-900 line-clamp-1">
            {club.name}
          </h3>
        </Link>

        <div className="mt-1 text-sm text-gray-600 line-clamp-1 flex items-center gap-2">
          {moderatorAvatar ? (
            <Link href={userPath(club.moderator?.username, moderatorName)} className="inline-flex items-center gap-2">
              <Avatar src={moderatorAvatar} size={20} alt={moderatorName} />
              <span className="truncate">{moderatorName}</span>
            </Link>
          ) : (
            <span className="truncate">{moderatorName}</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
          <span>👥 {club.memberCount} abone</span>
          <span>📚 {club.pickCount} seçki</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/clubs/${club.slug}`}
            className="inline-flex h-9 items-center rounded-full bg-gray-900 px-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            İncele
          </Link>
          <Link
            href={`/clubs/${club.slug}#subscribe`}
            className="inline-flex h-9 items-center rounded-full bg-rose-500 px-3 text-sm font-medium text-white hover:bg-rose-600"
          >
            Abone ol
          </Link>
          <div className="ml-auto text-xs text-gray-500">₺{club.priceTRY}</div>
        </div>
      </div>
    </div>
  )
}
