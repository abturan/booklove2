// src/app/api/posts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEmailVerifiedOrLegacy } from '@/lib/guards'
import { auth } from '@/lib/auth'
import { alertPostCreated, alertError } from '@/lib/adminAlert'

type Status = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REPORTED'

export async function GET(req: Request) {
  try {
    const session = await auth()
    const meId = session?.user?.id || null

    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope') || (meId ? 'friends' : 'global')
    const ownerIdParam = searchParams.get('ownerId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || '12'), 30)
    const cursor = searchParams.get('cursor') || undefined
    const rawStatus = (searchParams.get('status') || '').toUpperCase() as Status | ''
    const status: Status | null =
      rawStatus === 'PUBLISHED' || rawStatus === 'PENDING' || rawStatus === 'HIDDEN' || rawStatus === 'REPORTED'
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
        try {
          const [followingRows, followerRows] = await Promise.all([
            prisma.follow.findMany({
              where: { followerId: meId },
              select: { followingId: true },
            }),
            prisma.follow.findMany({
              where: { followingId: meId },
              select: { followerId: true },
            }),
          ])
          const followerSet = new Set(followerRows.map((row) => row.followerId))
          const friendIds = new Set<string>([meId])
          for (const row of followingRows) {
            if (followerSet.has(row.followingId)) {
              friendIds.add(row.followingId)
            }
          }
          ownerFilter = { in: Array.from(friendIds) }
        } catch {
          ownerFilter = { in: [meId] }
        }
      }
    }

    // ------- REPORTED özel mantık (gizlenmemiş + son şikayet tarihine göre sıralı) -------
    if (status === 'REPORTED') {
      const where: any = {
        reports: { some: {} },
        NOT: { status: 'HIDDEN' },
      }
      if (ownerFilter) where.ownerId = ownerFilter

      // Cursor'ı bu listede sağlıklı kullanmak için karmaşık alt-sorgu gerekir; sade tutuyoruz:
      // küçük sayılarla çalıştığı için birkaç fazla kayıt alıp bellekte sıralıyoruz.
      const batch = await prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit + 20, 50),
        select: {
          id: true,
          body: true,
          createdAt: true,
          status: true,
          owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
          images: { select: { url: true, width: true, height: true} },
          _count: { select: { likes: true, comments: true, reports: true } },
          reports: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      const sorted = batch
        .map(p => ({...p, __lastReportAt: p.reports[0]?.createdAt ? new Date(p.reports[0].createdAt).getTime() : 0 }))
        .sort((a,b) => (b.__lastReportAt - a.__lastReportAt))
        .slice(0, limit)
        .map(({ reports, __lastReportAt, ...rest }) => rest)

      // bu listede şimdilik sayfalama kapalı
      return NextResponse.json({ items: sorted, nextCursor: null })
    }

    // ------- Diğer durumlar: normal akış -------
    const where: any = {}
    if (ownerFilter) where.ownerId = ownerFilter

    if (status) {
      where.status = status
    } else {
      where.status = 'PUBLISHED'
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
        _count: { select: { likes: true, comments: true, reports: true } },
      }
    })

    let nextCursor: string | null = null
    if (posts.length > limit) {
      const next = posts.pop()
      nextCursor = next!.id
    }

    return NextResponse.json({ items: posts, nextCursor })
  } catch (e: any) {
    try { alertError('posts_list', e).catch(() => {}) } catch {}
    return NextResponse.json({ error: e?.message || 'Feed yüklenemedi' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  try {
    const ok = await isEmailVerifiedOrLegacy(meId)
    if (!ok) {
      return NextResponse.json({ error: 'E‑posta adresinizi doğrulamadan paylaşım yapamazsınız.', code: 'EMAIL_NOT_VERIFIED' }, { status: 403 })
    }
  } catch {}

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

  try { alertPostCreated({ userId: meId, postId: post.id, body: bodyText, images: images.length }).catch(() => {}) } catch {}
  return NextResponse.json({ ok: true, id: post.id, status: post.status })
}
