// src/app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Status = 'PUBLISHED' | 'PENDING' | 'HIDDEN'

export async function GET(req: Request) {
  try {
    const session = await auth()
    const meId = session?.user?.id || null
    const role = session?.user?.role || 'USER'

    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope') || (meId ? 'friends' : 'global')
    const ownerIdParam = searchParams.get('ownerId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || '12'), 30)
    const cursor = searchParams.get('cursor') || undefined
    const rawStatus = (searchParams.get('status') || '').toUpperCase() as Status | ''
    const status: Status | null =
      rawStatus === 'PUBLISHED' || rawStatus === 'PENDING' || rawStatus === 'HIDDEN'
        ? rawStatus
        : null

    let ownerFilter: any

    if (scope === 'owner' && ownerIdParam) {
      ownerFilter = { in: [ownerIdParam] }
    } else if (scope === 'self' && meId) {
      ownerFilter = { in: [meId] }
    } else if (scope === 'global') {
      ownerFilter = undefined
    } else {
      if (!meId) {
        ownerFilter = undefined
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
    }

    const where: any = {}
    if (ownerFilter) where.ownerId = ownerFilter

    if (status) {
      where.status = status
    } else {
      if (scope === 'global') {
        where.status = 'PUBLISHED'
      } else {
        where.status = 'PUBLISHED'
      }
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        body: true,
        createdAt: true,
        status: true,
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
      include: { images: { select: { url: true } }, }
    })

    if (last) {
      const lastUrls = (last.images || []).map((i) => i.url).filter(Boolean).sort()
      if (incomingUrls.join('|') === lastUrls.join('|')) {
        return NextResponse.json({ ok: true, id: last.id, status: (last as any).status || 'PENDING' })
      }
    }
  } catch {}

  let status: Status = 'PENDING'
  try {
    const lastAny = await prisma.post.findFirst({
      where: { ownerId: meId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
    const lastTs = lastAny ? new Date(lastAny.createdAt).getTime() : 0
    const windowMs = 10 * 60 * 1000
    status = !lastAny || now - lastTs >= windowMs ? 'PUBLISHED' : 'PENDING'
  } catch {
    status = 'PENDING'
  }

  const post = await prisma.post.create({
    data: {
      ownerId: meId,
      body: bodyText,
      status,
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
    select: { id: true, status: true }
  })

  return NextResponse.json({ ok: true, id: post.id, status: post.status })
}
