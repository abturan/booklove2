// src/components/sidebars/profile/ModeratorClubCard.tsx
import Link from 'next/link'
type Counts = { participants: number }

export default function ModeratorClubCard({
  name,
  slug,
  ownerName,
  ownerUsername,
  counts,
}: {
  name: string
  slug: string
  ownerName: string
  ownerUsername: string
  counts: Counts
}) {
  return (
    <section className="rounded-3xl overflow-hidden shadow-soft ring-1 ring-black/5">
      <div className="relative bg-primary text-white">
        <div className="absolute inset-0 bg-primary" aria-hidden />
        <div className="relative p-5 sm:p-6">
          <div className="text-2xl sm:text-3xl font-extrabold leading-tight break-words">{name}</div>
          <div className="mt-1 text-sm text-white/90 leading-tight">
            <div className="truncate">{ownerName}</div>
            {ownerUsername && <div className="truncate">@{ownerUsername}</div>}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-gray-900 text-sm ring-1 ring-black/10 shadow-sm">
              <span aria-hidden>👥</span>
              <span className="font-semibold tabular-nums">{counts.participants}</span>
              <span className="text-gray-700">Katılımcı</span>
            </span>
            <Link
              href={`/clubs/${slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-primary px-5 py-2 text-sm font-semibold hover:bg-white/90 transition"
            >
              Kulübe git →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
