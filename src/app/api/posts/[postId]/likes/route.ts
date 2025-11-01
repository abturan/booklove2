// src/app/api/posts/[postId]/likes/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  const meId = session?.user?.id || null
  const { postId } = params

  const [likesList, liked, count] = await Promise.all([
    prisma.like.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        user: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      },
    }),
    meId
      ? prisma.like
          .findUnique({ where: { postId_userId: { postId, userId: meId } } })
          .then(Boolean)
      : Promise.resolve(false),
    prisma.like.count({ where: { postId } }),
  ])

  const users = likesList.map((l) => l.user)

  let relationships: Record<string, 'self' | 'mutual' | 'following' | 'follower' | 'none'> = {}
  if (meId) {
    const otherIds = users.filter((u) => u.id !== meId).map((u) => u.id)
    if (otherIds.length > 0) {
      const relations = await prisma.follow.findMany({
        where: {
          OR: [
            { followerId: meId, followingId: { in: otherIds } },
            { followerId: { in: otherIds }, followingId: meId },
          ],
        },
        select: { followerId: true, followingId: true },
      })
      relationships = otherIds.reduce<Record<string, 'self' | 'mutual' | 'following' | 'follower' | 'none'>>((acc, id) => {
        const viewerFollows = relations.some((r) => r.followerId === meId && r.followingId === id)
        const targetFollows = relations.some((r) => r.followerId === id && r.followingId === meId)
        let mode: 'self' | 'mutual' | 'following' | 'follower' | 'none' = 'none'
        if (viewerFollows && targetFollows) mode = 'mutual'
        else if (viewerFollows) mode = 'following'
        else if (targetFollows) mode = 'follower'
        acc[id] = mode
        return acc
      }, {})
    }
  }

  const items = users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    slug: user.slug,
    avatarUrl: user.avatarUrl,
    relationship: user.id === meId ? 'self' : relationships[user.id] ?? 'none',
  }))

  return NextResponse.json({ items, liked, count })
}

export async function POST(_req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { postId } = params

  const existing = await prisma.like
    .findUnique({ where: { postId_userId: { postId, userId: meId } } })
    .catch(() => null)

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, liked: false })
  }

  await prisma.like.create({ data: { postId, userId: meId } })
  return NextResponse.json({ ok: true, liked: true })
}
