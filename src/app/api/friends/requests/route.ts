// src/app/api/friends/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureFollow, removeFollow } from '@/lib/follow'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const meId = session.user.id

  let targetId = ''
  let action = ''
  try {
    const body = await req.json()
    targetId = String(body?.userId || '').trim()
    action = String(body?.action || '').trim().toLowerCase()
  } catch {}

  if (!targetId) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (targetId === meId) {
    return NextResponse.json({ error: 'self_not_allowed' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
  if (!exists) {
    return NextResponse.json({ error: 'target_not_found' }, { status: 404 })
  }

  const now = new Date()

  // --- ACCEPT (follow back) ---
  if (action === 'accept') {
    const result = await ensureFollow({ followerId: meId, followingId: targetId })
    if (result.mutual) {
      await prisma.dmThread.updateMany({
        where: {
          OR: [
            { userAId: meId, userBId: targetId },
            { userAId: targetId, userBId: meId },
          ],
        },
        data: {
          status: 'ACTIVE',
          requestedById: null,
          requestedAt: null,
          lastDecisionAt: now,
        },
      })
    }
    return NextResponse.json({ status: result.mutual ? 'MUTUAL' : 'FOLLOWING', mutual: result.mutual })
  }

  // --- CANCEL (unfollow) ---
  if (action === 'cancel' || action === 'unfollow') {
    await removeFollow({ followerId: meId, followingId: targetId })
    return NextResponse.json({ status: 'UNFOLLOWED' })
  }

  // --- FOLLOW / UPSERT ---
  const result = await ensureFollow({ followerId: meId, followingId: targetId })
  if (result.mutual) {
    await prisma.dmThread.updateMany({
      where: {
        OR: [
          { userAId: meId, userBId: targetId },
          { userAId: targetId, userBId: meId },
        ],
      },
      data: {
        status: 'ACTIVE',
        requestedById: null,
        requestedAt: null,
        lastDecisionAt: now,
      },
    })
  }
  return NextResponse.json({ status: result.mutual ? 'MUTUAL' : 'FOLLOWING', mutual: result.mutual })
}
