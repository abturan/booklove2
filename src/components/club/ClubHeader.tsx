// src/components/club/ClubHeader.tsx
'use client'

import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

type Props = {
  moderatorName: string
  moderatorAvatarUrl?: string | null
  moderatorUsername?: string | null
  moderatorSlug?: string | null
  clubName: string
  description?: string | null
}

export default function ClubHeader({
  moderatorName,
  moderatorAvatarUrl,
  moderatorUsername,
  moderatorSlug,
  clubName,
  description,
}: Props) {
  return (
    <div>
      <div className="text-sm text-gray-600">Moderatör</div>
      <div className="mt-1 flex items-center gap-3">
        {moderatorAvatarUrl ? (
          <Link href={userPath(moderatorUsername, moderatorName, moderatorSlug)} className="inline-block">
            <Avatar src={moderatorAvatarUrl} size={80} alt={moderatorName} className="ring-2 ring-white shadow" />
          </Link>
        ) : (
          <span className="inline-grid place-items-center w-20 h-20 rounded-full bg-gray-100 text-gray-500 ring-2 ring-white shadow">
            <span className="text-sm">👤</span>
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold">
          {moderatorName} — {clubName}
        </h1>
      </div>
      {description && <p className="mt-2 text-gray-700">{description}</p>}
    </div>
  )
}
