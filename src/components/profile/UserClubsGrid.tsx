// src/components/profile/UserClubsGrid.tsx
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'

export default async function UserClubsGrid({ userId }: { userId: string }) {
  const memberships = await prisma.membership.findMany({
    where: { userId, isActive: true },
    orderBy: { joinedAt: 'desc' },
    include: {
      club: {
        select: {
          slug: true,
          name: true,
          bannerUrl: true,
          _count: { select: { memberships: true, picks: true, events: true } },
        },
      },
    },
  })

  if (!memberships.length) {
    return (
      <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
        Henüz kulüp üyeliği yok.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
      {memberships.map((m) => {
        const c = m.club
        const cover =
          c.bannerUrl ||
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop'

        return (
          <Link
            key={c.slug}
            href={`/clubs/${c.slug}`}
            className="group rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white hover:shadow transition"
          >
            <div className="relative h-28 w-full overflow-hidden">
              <Image
                src={cover}
                alt={c.name}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width:768px) 100vw, 33vw"
              />
            </div>
            <div className="p-3">
              <div className="font-semibold line-clamp-1">{c.name}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                  👥 {c._count.memberships}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                  📚 {c._count.picks}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                  🗓️ {c._count.events}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
