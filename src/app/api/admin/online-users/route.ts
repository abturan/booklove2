// src/app/api/admin/online-users/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const THRESHOLD_MIN = 5

export async function GET() {
  const session = await auth()
  if (!session?.user || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const since = new Date(Date.now() - THRESHOLD_MIN * 60 * 1000)
  const users = await prisma.user.findMany({
    where: { lastSeenAt: { gte: since } },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true, name: true, username: true, slug: true, avatarUrl: true, lastSeenAt: true },
    take: 500,
  })
  return NextResponse.json({ items: users, thresholdMin: THRESHOLD_MIN })
}

