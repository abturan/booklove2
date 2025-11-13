// src/app/api/users/[username]/feed/route.ts  ⟵ (YENİ: public profil feed'i)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { username: string } }) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') || '12'), 30)
  const cursor = searchParams.get('cursor') || undefined

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'Kullanıcı yok' }, { status: 404 })

  const repostSelect = {
    id: true,
    body: true,
    createdAt: true,
    owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
    images: { select: { url: true, width: true, height: true } },
    repostOf: {
      select: {
        id: true,
        body: true,
        createdAt: true,
        owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
        images: { select: { url: true, width: true, height: true } },
      },
    },
  }

  const rows = await prisma.post.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    select: {
      id: true,
      body: true,
      createdAt: true,
      status: true,
      owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
      images: { select: { url: true, width: true, height: true } },
      repostOf: { select: repostSelect },
      _count: { select: { likes: true, comments: true } },
    },
  })

  let nextCursor: string | null = null
  if (rows.length > limit) {
    const next = rows.pop()
    nextCursor = next!.id
  }
  return NextResponse.json({ items: rows, nextCursor })
}
