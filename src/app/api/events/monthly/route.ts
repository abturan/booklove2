// src/app/api/events/monthly/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const events = await (prisma as any).clubEvent.findMany({
      where: {
        startsAt: {
          gte: monthStart,
          lt: monthEnd,
        },
        club: {
          published: true,
        },
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        title: true,
        startsAt: true,
        club: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
      take: 300,
    })

    const items = (events || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      clubSlug: event.club?.slug || null,
      clubName: event.club?.name || null,
    }))

    return NextResponse.json({ events: items })
  } catch (err) {
    return NextResponse.json({ events: [] }, { status: 500 })
  }
}

