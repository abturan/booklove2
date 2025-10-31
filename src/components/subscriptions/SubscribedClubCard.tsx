// src/components/subscriptions/SubscribedClubCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import Avatar from '@/components/Avatar'

type ClubLite = {
  id: string
  slug: string
  name: string
  description?: string | null
  bannerUrl?: string | null
  priceTRY?: number | null
  capacity?: number | null
  moderator?: { id: string; name: string | null; username: string | null; avatarUrl: string | null } | null
  _count?: { memberships: number; events: number }
}

type EventLite = {
  id: string
  title: string
  startsAt: string
  priceTRY: number
  capacity: number | null
}

function formatDateTimeTR(iso: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function SubscribedClubCard({ club, event }: { club: ClubLite; event: EventLite | null }) {
  const href = `/clubs/${club.slug}` // rotanız farklıysa burada düzeltin
  const price = event?.priceTRY ?? club.priceTRY ?? null

  return (
    <div className="card p-0 overflow-hidden">
      <Link href={href} prefetch className="block">
        <div className="relative aspect-[16/9] bg-gray-100">
          {club.bannerUrl ? (
            <Image src={club.bannerUrl} alt={club.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
          ) : null}
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar src={club.moderator?.avatarUrl ?? null} size={36} alt={club.moderator?.name || 'Moderatör'} />
          <div className="min-w-0">
            <Link href={href} prefetch className="text-base font-semibold line-clamp-1">
              {club.name}
            </Link>
            <div className="text-xs text-gray-600 line-clamp-1">
              {club.moderator?.name}
              {club.moderator?.username ? ` · @${club.moderator.username}` : ''}
            </div>
          </div>
        </div>

        {club.description ? (
          <p className="text-sm text-gray-700 line-clamp-2">{club.description}</p>
        ) : null}

        {event && (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-xs text-gray-700">
            <div className="font-semibold text-gray-900 text-sm">{event.title}</div>
            <div className="mt-1">{formatDateTimeTR(event.startsAt)}</div>
            {typeof event.capacity === 'number' && (
              <div className="mt-1 text-gray-500">Kontenjan: {event.capacity > 0 ? event.capacity : '—'}</div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-700">
          <span className="inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M4 20v-7a8 8 0 0 1 16 0v7" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>
            {club._count?.memberships ?? 0} abone
          </span>
          <span className="inline-flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 7h8M6 12h12M8 17h8" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>
            {club._count?.events ?? 0} oturum
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-sm font-medium">
            {typeof price === 'number' ? `₺${price}` : ''}
          </div>
          <Link
            href={href}
            prefetch
            className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm"
          >
            İncele
          </Link>
        </div>
      </div>
    </div>
  )
}
