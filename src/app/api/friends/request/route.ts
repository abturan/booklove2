// src/app/api/friends/request/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureFollow, removeFollow } from '@/lib/follow'
import { createNotification } from '@/lib/notify'
import { sendNotificationEmail } from '@/lib/notify-email'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const { toUserId, action } = await req.json().catch(() => ({}))
  if (!toUserId || toUserId === meId) {
    return NextResponse.json({ ok: false, error: 'Geçersiz kullanıcı' }, { status: 400 })
  }

  if (action === 'unfollow') {
    await removeFollow({ followerId: meId, followingId: toUserId })
    return NextResponse.json({ ok: true, status: 'UNFOLLOWED' })
  }

  const result = await ensureFollow({ followerId: meId, followingId: toUserId })

  if (result.mutual) {
    await prisma.dmThread.updateMany({
      where: {
        OR: [
          { userAId: meId, userBId: toUserId },
          { userAId: toUserId, userBId: meId },
        ],
      },
      data: {
        status: 'ACTIVE',
        requestedById: null,
        requestedAt: null,
        lastDecisionAt: new Date(),
      },
    })
  }

  // notify target user about new follower (or mutual)
  try {
    const payload = { byId: meId, url: `/u/${session.user.username || ''}` }
    await createNotification({ userId: toUserId, type: 'follow', payload })
    sendNotificationEmail(toUserId, 'follow', payload).catch(() => {})
  } catch {}

  return NextResponse.json({ ok: true, status: result.mutual ? 'MUTUAL' : 'FOLLOWING' })
}
