import Link from 'next/link'
import Image from 'next/image'

type Counts = { memberships: number; picks: number; events: number }

export default function ModeratorClubCard({
  name,
  slug,
  bannerUrl,
  ownerName,
  ownerUsername,
  counts,
}: {
  name: string
  slug: string
  bannerUrl: string | null
  ownerName: string
  ownerUsername: string
  counts: Counts
}) {
  const bg = bannerUrl && bannerUrl.trim().length > 0 ? bannerUrl : '/images/club-bg-red.svg'

  return (
    <section className="rounded-3xl overflow-hidden shadow-soft ring-1 ring-black/5">
      <div className="relative bg-primary text-white">
        <Image
          src={bg}
          alt=""
          width={800}
          height={400}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative p-5 sm:p-6">
          <div className="text-2xl sm:text-3xl font-extrabold leading-tight break-words">{name}</div>
          <div className="mt-1 text-sm text-white/90 leading-tight">
            <div className="truncate">{ownerName}</div>
            {ownerUsername && <div className="truncate">@{ownerUsername}</div>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-sm">
              👥 <span className="font-semibold">{counts.memberships}</span> <span className="opacity-90">Üye</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/90 text-white text-sm">
              📚 <span className="font-semibold">{counts.picks}</span> <span className="opacity-90">Seçki</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-sm">
              🗓️ <span className="font-semibold">{counts.events}</span> <span className="opacity-90">Oturum</span>
            </span>
          </div>

          <Link
            href={`/clubs/${slug}`}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white text-primary px-5 py-2 text-sm font-semibold hover:bg-white/90 transition"
          >
            Klube git →
          </Link>
        </div>
      </div>
    </section>
  )
}
