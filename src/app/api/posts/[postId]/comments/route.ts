// src/app/api/posts/[postId]/comments/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notify'
import { isEmailVerifiedOrLegacy } from '@/lib/guards'
import { sendNotificationEmail } from '@/lib/notify-email'
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50)
  const postId = params.postId

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true, body: true, createdAt: true,
      user: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } }
    }
  })
  return NextResponse.json({ items: comments })
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
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { ownerId: true } })
    if (post?.ownerId && post.ownerId !== meId) {
      const payload = { byId: meId, postId, commentId: c.id, url: `/bookie/share/${postId}` }
      await createNotification({ userId: post.ownerId, type: 'post_comment', payload })
      sendNotificationEmail(post.ownerId, 'post_comment', payload).catch(() => {})
    }
  } catch {}
  return NextResponse.json({ ok: true })
}
