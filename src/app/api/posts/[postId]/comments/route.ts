// src/app/api/posts/[postId]/comments/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notify'
import { isEmailVerifiedOrLegacy } from '@/lib/guards'
import { sendNotificationEmail } from '@/lib/notify-email'
import { auth } from '@/lib/auth'
import { alertComment, alertError } from '@/lib/adminAlert'

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50)
  const postId = params.postId
  const session = await auth().catch(() => null)
  const meId = session?.user?.id ?? null

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true, body: true, createdAt: true,
      _count: { select: { likes: true } },
      user: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } }
    }
  })
  let likedMap = new Set<string>()
  if (meId && comments.length > 0) {
    const likedRows = await prisma.commentLike.findMany({
      where: { userId: meId, commentId: { in: comments.map((c) => c.id) } },
      select: { commentId: true },
    })
    likedMap = new Set(likedRows.map((row) => row.commentId))
  }
  return NextResponse.json({
    items: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      user: c.user,
      likes: c._count?.likes ?? 0,
      likedByMe: likedMap.has(c.id),
    })),
  })
}

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const postId = params.postId
  try {
    const ok = await isEmailVerifiedOrLegacy(meId)
    if (!ok) {
      return NextResponse.json({ error: 'E‑posta adresinizi doğrulamadan yorum yapamazsınız.', code: 'EMAIL_NOT_VERIFIED' }, { status: 403 })
    }
  } catch {}

  const payload = await req.json().catch(() => null)
  if (!payload || typeof payload.body !== 'string' || !payload.body.trim()) {
    return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
  }

  const c = await prisma.comment.create({
    data: { postId, userId: meId, body: payload.body.trim() }
  })
  let postOwnerId: string | null = null
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { ownerId: true } })
    postOwnerId = post?.ownerId || null
    if (post?.ownerId && post.ownerId !== meId) {
      const payload = { byId: meId, postId, commentId: c.id, url: `/bookie/share/${postId}` }
      await createNotification({ userId: post.ownerId, type: 'post_comment', payload })
      sendNotificationEmail(post.ownerId, 'post_comment', payload).catch(() => {})
    }
  } catch {}
  try {
    const watchers = await prisma.comment.findMany({
      where: { postId, userId: { not: meId } },
      distinct: ['userId'],
      select: { userId: true },
    })
    const watcherIds = watchers
      .map((row) => row.userId)
      .filter((id): id is string => Boolean(id) && id !== meId && id !== postOwnerId)
    if (watcherIds.length > 0) {
      const payload = { byId: meId, postId, commentId: c.id, url: `/bookie/share/${postId}` }
      for (const watcherId of watcherIds) {
        await createNotification({ userId: watcherId, type: 'post_comment_reply', payload })
        sendNotificationEmail(watcherId, 'post_comment_reply', payload).catch(() => {})
      }
    }
  } catch {}
  try { alertComment({ userId: meId, postId, ownerId: undefined, commentId: c.id, body: payload.body.trim() }).catch(() => {}) } catch {}
  return NextResponse.json({ ok: true })
}
