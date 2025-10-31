// src/app/api/me/is-member/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ isMember: false }, { status: 200 })
  }

  if (session.user.role === 'ADMIN') {
    return NextResponse.json({ isMember: true, memberSince: null }, { status: 200 })
  }

  const eventId = req.nextUrl.searchParams.get('eventId') || ''
  const clubId = req.nextUrl.searchParams.get('clubId') || ''

  if (eventId) {
    const event = await prisma.clubEvent.findUnique({
      where: { id: eventId },
      select: { id: true, clubId: true, club: { select: { moderatorId: true } } },
    })
    if (!event) return NextResponse.json({ isMember: false }, { status: 200 })

    if (event.club.moderatorId === session.user.id) {
      return NextResponse.json({ isMember: true, memberSince: null }, { status: 200 })
    }

    const m = await prisma.membership.findUnique({
      where: { userId_clubEventId: { userId: session.user.id, clubEventId: eventId } },
      select: { isActive: true, joinedAt: true },
    })

    return NextResponse.json({
      isMember: !!m?.isActive,
      memberSince: m?.isActive ? m.joinedAt.toISOString() : null,
    })
  }

  if (clubId) {
    const m = await prisma.membership.findFirst({
      where: { userId: session.user.id, clubId, isActive: true },
      orderBy: { joinedAt: 'desc' },
      select: { joinedAt: true },
    })
    return NextResponse.json({
      isMember: !!m,
      memberSince: m ? m.joinedAt.toISOString() : null,
    })
  }

  return NextResponse.json({ isMember: false }, { status: 200 })
}
