// src/app/api/comments/[commentId]/like/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notify'
import { sendNotificationEmail } from '@/lib/notify-email'

export async function POST(_req: Request, { params }: { params: { commentId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const commentId = params.commentId

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, postId: true },
  })
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  let liked = false
  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: meId } },
  })

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } })
    liked = false
  } else {
    await prisma.commentLike.create({ data: { commentId, userId: meId } })
    liked = true
    if (comment.userId && comment.userId !== meId) {
      const payload = { byId: meId, postId: comment.postId, commentId, url: `/bookie/share/${comment.postId}` }
      try {
        await createNotification({ userId: comment.userId, type: 'comment_like', payload })
        sendNotificationEmail(comment.userId, 'comment_like', payload).catch(() => {})
      } catch {}
    }
  }

  const count = await prisma.commentLike.count({ where: { commentId } })
  return NextResponse.json({ liked, count })
}
