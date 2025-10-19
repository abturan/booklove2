// src/app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const meId = session.user.id

    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope') || 'friends'
    const limit = Math.min(Number(searchParams.get('limit') || '12'), 30)
    const cursor = searchParams.get('cursor') || undefined

    let ownerFilter: any

    if (scope === 'global') {
      ownerFilter = undefined
    } else if (scope === 'self') {
      ownerFilter = { in: [meId] }
    } else {
      let friendIds = new Set<string>([meId])
      try {
        const accepted = await prisma.friendRequest.findMany({
          where: { status: 'ACCEPTED', OR: [{ fromId: meId }, { toId: meId }] },
          select: { fromId: true, toId: true }
        })
        for (const fr of accepted) {
          if (fr.fromId !== meId) friendIds.add(fr.fromId)
          if (fr.toId !== meId) friendIds.add(fr.toId)
        }
      } catch {
        friendIds = new Set<string>([meId])
      }
      ownerFilter = { in: Array.from(friendIds) }
    }

    const posts = await prisma.post.findMany({
      where: ownerFilter ? { ownerId: ownerFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true, body: true, createdAt: true,
        owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
        images: { select: { url: true, width: true, height: true } },
        _count: { select: { likes: true, comments: true } },
      }
    })

    let nextCursor: string | null = null
    if (posts.length > limit) {
      const next = posts.pop()
      nextCursor = next!.id
    }

    return NextResponse.json({ items: posts, nextCursor })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Feed yüklenemedi' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const payload = await req.json().catch(() => null)
  if (!payload || (typeof payload.body !== 'string' && !Array.isArray(payload.images))) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const bodyText = typeof payload.body === 'string' ? payload.body.trim() : ''
  const images = Array.isArray(payload.images) ? payload.images : []
  if (!bodyText && images.length === 0) {
    return NextResponse.json({ error: 'Metin veya görsel ekleyin' }, { status: 400 })
  }

  const now = Date.now()
  const since = new Date(now - 30_000)
  const incomingUrls = images.map((x: any) => String(x?.url || '')).filter(Boolean).sort()

  try {
    const last = await prisma.post.findFirst({
      where: { ownerId: meId, createdAt: { gte: since }, body: bodyText },
      orderBy: { createdAt: 'desc' },
      include: { images: { select: { url: true } } }
    })

    if (last) {
      const lastUrls = (last.images || []).map((i) => i.url).filter(Boolean).sort()
      if (incomingUrls.join('|') === lastUrls.join('|')) {
        return NextResponse.json({ ok: true, id: last.id })
      }
    }
  } catch {}

  const post = await prisma.post.create({
    data: {
      ownerId: meId,
      body: bodyText,
      images: {
        create: images
          .filter((x: any) => x && typeof x.url === 'string' && x.url.trim())
          .map((x: any) => ({
            url: x.url.trim(),
            width: typeof x.width === 'number' ? x.width : null,
            height: typeof x.height === 'number' ? x.height : null,
          })),
      },
    },
    select: { id: true }
  })

  return NextResponse.json({ ok: true, id: post.id })
}
