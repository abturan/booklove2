import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const club = await prisma.club.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      events: {
        orderBy: { startsAt: 'asc' },
        select: { id: true, title: true, startsAt: true, notes: true },
      },
    },
  })

  if (!club) {
    return NextResponse.json({ events: [] }, { status: 404 })
  }

  const now = new Date()
  const events = club.events.map((event) => ({
    id: event.id,
    title: event.title ?? 'Etkinlik',
    startsAt: event.startsAt.toISOString(),
    notes: event.notes ?? null,
    status: event.startsAt >= now ? 'upcoming' : 'past',
  }))

  return NextResponse.json({ events })
}
