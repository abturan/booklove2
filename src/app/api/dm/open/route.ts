// src/app/api/dm/open/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFollowRelation } from '@/lib/follow'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const rawPeer = String(searchParams.get('peerId') || '').trim()
  if (!rawPeer) return NextResponse.json({ error: 'invalid_peer' }, { status: 400 })

  const me = session.user.id
  if (rawPeer === me) return NextResponse.json({ error: 'self_not_allowed' }, { status: 400 })

  const peer = await prisma.user.findUnique({ where: { id: rawPeer }, select: { id: true } })
  if (!peer) return NextResponse.json({ error: 'peer_not_found' }, { status: 404 })

  const [a, b] = me < rawPeer ? [me, rawPeer] : [rawPeer, me]
  const relation = await getFollowRelation(me, rawPeer)

  let thread = await prisma.dmThread.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
    select: { id: true, status: true },
  })

  if (!thread) {
    thread = await prisma.dmThread.create({
      data: {
        userAId: a,
        userBId: b,
        status: relation === 'mutual' ? 'ACTIVE' : 'REQUESTED',
        requestedById: relation === 'mutual' ? null : me,
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
  }

  return NextResponse.json({ threadId: thread.id })
}
