// src/app/api/dm/start/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFollowRelation } from '@/lib/follow'

function orderIds(a: string, b: string) {
  return a < b ? ([a, b] as const) : ([b, a] as const)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const { peerId } = await req.json()
  if (!peerId || peerId === meId) {
    return NextResponse.json({ ok: false, error: 'Geçersiz kullanıcı' }, { status: 400 })
  }

  const [userAId, userBId] = orderIds(meId, peerId)
  const relation = await getFollowRelation(meId, peerId)

  let thread = await prisma.dmThread.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    select: { id: true, status: true },
  })

  if (!thread) {
    thread = await prisma.dmThread.create({
      data: {
        userAId,
        userBId,
        status: relation === 'mutual' ? 'ACTIVE' : 'REQUESTED',
        requestedById: relation === 'mutual' ? null : meId,
        requestedAt: relation === 'mutual' ? null : new Date(),
      },
      select: { id: true, status: true },
    })
  } else if (relation === 'mutual' && thread.status !== 'ACTIVE') {
    await prisma.dmThread.update({
      where: { id: thread.id },
      data: {
        status: 'ACTIVE',
        requestedById: null,
        requestedAt: null,
        lastDecisionAt: new Date(),
      },
    })
  } else if (relation !== 'mutual') {
    await prisma.dmThread.update({
      where: { id: thread.id },
      data: {
        status: 'REQUESTED',
        requestedById: meId,
        requestedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ok: true, threadId: thread.id })
}
