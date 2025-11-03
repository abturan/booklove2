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
    } else if (scope === 'following' && meId) {
      try {
        const followingRows = await prisma.follow.findMany({ where: { followerId: meId }, select: { followingId: true } })
        const ids = Array.from(new Set([meId, ...followingRows.map(r => r.followingId)]))
        ownerFilter = { in: ids }
      } catch {
        ownerFilter = { in: [meId] }
      }
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

    // Repost alanı henüz deploy edilmemiş olabilir — güvenli geriye uyum
    const common = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
    } as const
    const selectWithRepost = {
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
        },
      },
      _count: { select: { likes: true, comments: true, reports: true } },
    }
    const selectLegacy = {
      id: true,
      body: true,
      createdAt: true,
      status: true,
      owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      images: { select: { url: true, width: true, height: true } },
      _count: { select: { likes: true, comments: true, reports: true } },
    }
    let posts: any[]
    let withRel = true
    try {
      posts = await (prisma as any).post.findMany({ ...common, select: selectWithRepost })
    } catch {
      posts = await (prisma as any).post.findMany({ ...common, select: selectLegacy })
      withRel = false
    }

    // Fallback: repost ilişkisi yoksa ve gövdede [repost:<id>] marker'ı varsa alıntıyı sunucu tarafında zenginleştir
    if (!withRel) {
      const markerRe = /\[repost:([a-zA-Z0-9]+)\]\s*$/
      const ids = Array.from(new Set(posts.map((p: any) => {
        const m = typeof p.body === 'string' ? p.body.match(markerRe) : null
        return m ? m[1] : null
      }).filter(Boolean))) as string[]

      if (ids.length) {
        const refRows = await prisma.post.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            body: true,
            createdAt: true,
            owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
            images: { select: { url: true, width: true, height: true } },
          },
        })
        const map: Record<string, any> = {}
        for (const r of refRows) map[r.id] = r
        posts = posts.map((p: any) => {
          const m = typeof p.body === 'string' ? p.body.match(markerRe) : null
          if (!m) return p
          const id = m[1]
          const ref = map[id]
          if (!ref) return p
          return { ...p, body: p.body.replace(markerRe, '').trimEnd(), repostOf: ref }
        })
      }
    }

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
  if (!payload || (typeof payload.body !== 'string' && !Array.isArray(payload.images) && !payload.repostOfId)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  const bodyText = typeof payload.body === 'string' ? payload.body.trim() : ''
  const images = Array.isArray(payload.images) ? payload.images : []
  const repostOfId = typeof payload.repostOfId === 'string' ? payload.repostOfId : null
  if (!bodyText && images.length === 0 && !repostOfId) {
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
    // Yayınlama penceresi: 10 dakikada en fazla 10 post doğrudan yayımlansın
    const windowMs = 10 * 60 * 1000
    const sinceWindow = new Date(now - windowMs)
    const recentCount = await prisma.post.count({ where: { ownerId: meId, createdAt: { gte: sinceWindow } } })
    status = recentCount < 10 ? 'PUBLISHED' : 'PENDING'
  } catch {
    status = 'PENDING'
  }

  async function createPost(withRepost: boolean) {
    return (prisma as any).post.create({
      data: {
        ownerId: meId,
        // Fallback için gövdeye marker ekleyebiliriz (repost ilişkisiz şema için)
        body: withRepost ? bodyText : (repostOfId ? (bodyText ? `${bodyText}\n\n[repost:${repostOfId}]` : `[repost:${repostOfId}]`) : bodyText),
        status,
        ...(withRepost && repostOfId ? { repostOfId } : {}),
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
      select: { id: true, status: true },
    })
  }
  let post
  try {
    post = await createPost(true)
  } catch {
    // Eski şemada repost alanı yoksa: repostOfId olmadan oluştur
    post = await createPost(false)
  }

  try { alertPostCreated({ userId: meId, postId: post.id, body: bodyText, images: images.length }).catch(() => {}) } catch {}
  return NextResponse.json({ ok: true, id: post.id, status: post.status })
}
