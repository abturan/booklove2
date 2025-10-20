// src/components/profile/ProfileHero.tsx
import Image from 'next/image'
import clsx from 'clsx'

type Counts = { memberships?: number | null; picks?: number | null; events?: number | null }

type Props = {
  name: string
  username?: string | null
  avatarUrl?: string | null
  bannerUrl?: string | null
  actionSlot?: React.ReactNode
  counts?: Counts
}

export default function ProfileHero({
  name,
  username,
  avatarUrl,
  bannerUrl,
  actionSlot,
  counts,
}: Props) {
  const cover =
    typeof bannerUrl === 'string' && bannerUrl.trim().length > 0
      ? bannerUrl
      : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop'

  const c: Counts = {
    memberships: counts?.memberships ?? null,
    picks: counts?.picks ?? null,
    events: counts?.events ?? null,
  }
  const showCounts = typeof counts !== 'undefined' && (c.memberships ?? c.picks ?? c.events) !== null

  return (
    <section className="relative">
      <div className="relative h-56 md:h-72 lg:h-80 rounded-3xl overflow-hidden">
        <Image src={cover} alt="" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
      </div>

      <div className="relative">
        <div className="container mx-auto px-4">
          <div className="mt-0 flex items-start justify-between">
            <div className="flex items-start gap-4 md:gap-6">
              <div
                className={clsx(
                  '-mt-10 md:-mt-14 lg:-mt-20',
                  'relative rounded-full overflow-hidden bg-gray-100 ring-white shadow-xl shrink-0',
                  'w-[128px] h-[128px] md:w-[148px] md:h-[148px] lg:w-[260px] lg:h-[260px]',
                  'ring-4 lg:ring-8'
                )}
                aria-label={name}
              >
                <Image
                  src={
                    avatarUrl && avatarUrl.trim()
                      ? avatarUrl
                      : `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(name || 'user')}`
                  }
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(min-width:1024px) 260px, (min-width:768px) 148px, 128px"
                  unoptimized={!!(avatarUrl && avatarUrl.startsWith('/uploads/'))}
                />
              </div>

              <div className="pt-2 md:pt-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 break-words">
                  {name}
                </h1>
                {username && <div className="text-gray-600 font-medium break-words">@{username}</div>}
                {actionSlot ? <div className="mt-2">{actionSlot}</div> : null}
                {showCounts && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.memberships !== null && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-gray-900 text-sm ring-1 ring-black/10 shadow-sm">
                        <span aria-hidden>👥</span>
                        <span className="font-semibold tabular-nums">{c.memberships ?? 0}</span>
                        <span className="text-gray-700">Üye</span>
                      </span>
                    )}
                    {c.picks !== null && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-gray-900 text-sm ring-1 ring-black/10 shadow-sm">
                        <span aria-hidden>📚</span>
                        <span className="font-semibold tabular-nums">{c.picks ?? 0}</span>
                        <span className="text-gray-700">Seçki</span>
                      </span>
                    )}
                    {c.events !== null && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-gray-900 text-sm ring-1 ring-black/10 shadow-sm">
                        <span aria-hidden>🗓️</span>
                        <span className="font-semibold tabular-nums">{c.events ?? 0}</span>
                        <span className="text-gray-700">Oturum</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden" />
          </div>
        </div>
      </div>
    </section>
  )
}






