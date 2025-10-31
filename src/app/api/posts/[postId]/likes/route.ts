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

  let relationships: Record<string, 'self' | 'friend' | 'outgoing' | 'incoming' | 'none'> = {}
  if (meId) {
    const otherIds = users.filter((u) => u.id !== meId).map((u) => u.id)
    if (otherIds.length > 0) {
      const relations = await prisma.friendRequest.findMany({
        where: {
          OR: [
            { fromId: meId, toId: { in: otherIds } },
            { fromId: { in: otherIds }, toId: meId },
          ],
        },
        select: { fromId: true, toId: true, status: true, respondedAt: true },
        orderBy: { createdAt: 'desc' },
      })
      const grouped = new Map<string, typeof relations>()
      for (const r of relations) {
        const other = r.fromId === meId ? r.toId : r.fromId
        if (!grouped.has(other)) grouped.set(other, [])
        grouped.get(other)!.push(r)
      }
      relationships = otherIds.reduce<Record<string, 'self' | 'friend' | 'outgoing' | 'incoming' | 'none'>>((acc, id) => {
        const rels = grouped.get(id) || []
        let mode: 'self' | 'friend' | 'outgoing' | 'incoming' | 'none' = 'none'
        if (rels.some((r) => r.status === 'ACCEPTED')) {
          mode = 'friend'
        } else {
          const mine = rels.find((r) => r.fromId === meId && r.toId === id)
          const theirs = rels.find((r) => r.toId === meId && r.fromId === id)
          if (mine?.status === 'PENDING') mode = 'outgoing'
          else if (theirs?.status === 'PENDING' && !theirs.respondedAt) mode = 'incoming'
        }
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
