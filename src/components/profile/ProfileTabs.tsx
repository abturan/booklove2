// src/components/profile/ProfileTabs.tsx
'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'

type Count = { memberships?: number; picks?: number; events?: number }
type ClubLite = {
  slug: string
  name: string
  bannerUrl: string | null
  _count?: Count
}
type Membership = { club: ClubLite }

/**
 * Sağ panel sekmeleri (Hakkında / Kulüpler)
 * - Sunucu tarafına fonksiyon taşımaz; yalnızca veri alır
 * - Boş/eksik verilerde güvenli çalışır (defansif)
 * - Sekmeye tıklayınca scroll yapmaz, yalnızca içerik değiştirir
 */
export default function ProfileTabs({
  bio,
  memberships,
  className,
}: {
  bio?: string | null
  memberships?: Membership[] | null
  className?: string
}) {
  const list = Array.isArray(memberships) ? memberships : []

  const hasAbout = !!(bio && bio.trim().length > 0)
  const hasClubs = list.length > 0

  // hiç içerik yoksa hiç render etmeyelim
  if (!hasAbout && !hasClubs) return null

  const initial = useMemo<'about' | 'clubs'>(() => {
    if (hasAbout) return 'about'
    if (hasClubs) return 'clubs'
    return 'about'
  }, [hasAbout, hasClubs])

  const [active, setActive] = useState<'about' | 'clubs'>(initial)

  return (
    <div className={clsx('w-full space-y-4', className)}>
      {/* Sekme başlıkları */}
      <div className="w-full rounded-2xl bg-white/80 backdrop-blur p-1 ring-1 ring-black/5 shadow-sm grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setActive('about')}
          className={clsx(
            'h-11 rounded-xl text-sm font-semibold transition',
            active === 'about' ? 'bg-primary text-white shadow' : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-pressed={active === 'about'}
          disabled={!hasAbout}
          title={hasAbout ? 'Hakkında' : 'Hakkında yok'}
        >
          Hakkında
        </button>
        <button
          type="button"
          onClick={() => setActive('clubs')}
          className={clsx(
            'h-11 rounded-xl text-sm font-semibold transition',
            active === 'clubs' ? 'bg-primary text-white shadow' : 'text-gray-700 hover:bg-gray-100'
          )}
          aria-pressed={active === 'clubs'}
          disabled={!hasClubs}
          title={hasClubs ? 'Kulüpler' : 'Kulüp yok'}
        >
          Kulüpler
        </button>
      </div>

      {/* İçerik */}
      {active === 'about' && hasAbout && (
        <div className="card p-5 text-gray-800 leading-7">
          {bio}
        </div>
      )}

      {active === 'clubs' && hasClubs && (
        <div className="space-y-3">
          {list.map((m, i) => {
            const c = m.club
            const members = c._count?.memberships ?? 0
            const picks = c._count?.picks ?? 0
            const events = c._count?.events ?? 0
            const cover =
              (typeof c.bannerUrl === 'string' && c.bannerUrl.trim()) ||
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop'

            return (
              <Link
                key={`${c.slug}-${i}`}
                href={`/clubs/${c.slug}`}
                className="group flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur p-3 ring-1 ring-black/5 shadow-sm hover:shadow transition"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-gray-900 group-hover:text-primary">
                    {c.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 ring-1 ring-black/5">
                      👥 <b className="tabular-nums">{members}</b> üye
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 ring-1 ring-black/5">
                      📚 <b className="tabular-nums">{picks}</b> seçki
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 ring-1 ring-black/5">
                      🗓️ <b className="tabular-nums">{events}</b> oturum
                    </span>
                  </div>
                </div>

                <span className="ml-auto text-sm text-primary/80">Git →</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
