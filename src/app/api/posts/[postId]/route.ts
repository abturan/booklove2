// src/app/api/posts/[postId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: { postId: string } }) {
  const { postId } = params
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      body: true,
      createdAt: true,
      status: true,
      owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      images: { select: { url: true, width: true, height: true } },
      repostOf: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
          images: { select: { url: true, width: true, height: true } },
          // one more level for context
          repostOf: {
            select: {
              id: true,
              body: true,
              createdAt: true,
              owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
              images: { select: { url: true, width: true, height: true } },
            },
          },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  })
  if (!post) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json({
    id: post.id,
    body: post.body,
    createdAt: post.createdAt,
    status: post.status,
    owner: post.owner,
    images: post.images,
    counts: { likes: post._count.likes, comments: post._count.comments },
    repostOf: post.repostOf || null,
  })
}

export async function PATCH(req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { postId } = params

  const payload = await req.json().catch(() => null)
  const body = typeof payload?.body === 'string' ? payload.body.trim() : ''
  const images = Array.isArray(payload?.images) ? payload.images : undefined
  if (!body && (!images || images.length === 0)) return NextResponse.json({ error: 'İçerik boş' }, { status: 400 })
  if (images && images.length > 5) return NextResponse.json({ error: 'En fazla 5 görsel' }, { status: 400 })

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { ownerId: true } })
  if (!post) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (post.ownerId !== meId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.$transaction(async (tx) => {
    await tx.post.update({ where: { id: postId }, data: { body } })
    if (images) {
      await tx.postImage.deleteMany({ where: { postId } })
      if (images.length > 0) {
        await tx.postImage.createMany({
          data: images
            .filter((x: any) => x && typeof x.url === 'string' && x.url.trim())
            .slice(0, 5)
            .map((x: any) => ({
              postId,
              url: x.url.trim(),
              width: typeof x.width === 'number' ? x.width : null,
              height: typeof x.height === 'number' ? x.height : null,
            })),
        })
      }
    }
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { postId } = params

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { ownerId: true } })
  if (!post) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (post.ownerId !== meId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany({ where: { postId } })
    await tx.like.deleteMany({ where: { postId } })
    await tx.postImage.deleteMany({ where: { postId } })
    await tx.post.delete({ where: { id: postId } })
  })

  return NextResponse.json({ ok: true })
}
