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
  const clubId = req.nextUrl.searchParams.get('clubId') || ''
  if (!clubId) return NextResponse.json({ isMember: false }, { status: 200 })

  const m = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
    select: { isActive: true, joinedAt: true },
  })

  return NextResponse.json({
    isMember: !!m?.isActive,
    memberSince: m?.isActive ? m.joinedAt.toISOString() : null,
  })
}
