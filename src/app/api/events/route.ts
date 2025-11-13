// src/app/api/events/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type SortKey = 'members_desc' | 'members_asc' | 'created_desc' | 'created_asc'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const q = (searchParams.get('q') || '').trim()
  // Default: newest sessions first
  const sort = (searchParams.get('sort') as SortKey) || 'created_desc'
  const limit = Number(searchParams.get('limit') || '0') || undefined
  const pageParam = Number(searchParams.get('page') || '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
  const skip = limit ? (page - 1) * limit : undefined
  const hideSoldOut = searchParams.get('soldout') === '1'
  const includePast = searchParams.get('past') === '1'

  // Basic search filter
  const tokens = q.split(/\s+/).filter(Boolean)
  const where: any = {
    club: { published: true },
  }
  if (!includePast) {
    // Only list upcoming and ongoing sessions on homepage unless past view enabled
    where.startsAt = { gte: new Date(Date.now() - 1000 * 60 * 60 * 4) } // include recent ones within 4h
  }
  if (tokens.length > 0) {
    where.AND = tokens.map((tok) => ({
      OR: [
        { title: { contains: tok, mode: 'insensitive' } },
        { club: { name: { contains: tok, mode: 'insensitive' } } },
        { club: { moderator: { name: { contains: tok, mode: 'insensitive' } } } },
      ],
    }))
  }

  let orderBy: any
  if (sort === 'members_desc') orderBy = { memberships: { _count: 'desc' } }
  else if (sort === 'members_asc') orderBy = { memberships: { _count: 'asc' } }
  else if (sort === 'created_desc') orderBy = { startsAt: 'desc' }
  else if (sort === 'created_asc') orderBy = { startsAt: 'asc' }

  async function fetchBatch(skipValue: number, takeValue: number) {
    return prisma.clubEvent.findMany({
      where,
      orderBy,
      take: takeValue,
      skip: skipValue,
      select: {
        id: true,
        title: true,
        startsAt: true,
        notes: true,
        priceTRY: true,
        capacity: true,
        bookTitle: true,
        bookAuthor: true,
        bookTranslator: true,
        bookCoverUrl: true,
        club: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            bannerUrl: true,
            priceTRY: true,
            capacity: true,
            moderator: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
          },
        },
        _count: { select: { memberships: { where: { isActive: true } } } },
      },
    })
  }

  let filtered: Array<Awaited<ReturnType<typeof fetchBatch>>[number]> = []
  if (hideSoldOut && typeof limit === 'number') {
    // Ensure we fill the page after filtering by fetching batches until enough items collected or no more rows
    const need = page * limit
    let currentSkip = 0
    const batch = Math.max(Math.min(limit * 2, 60), limit)
    // start from the beginning to compute proper page slices after filtering
    while (filtered.length < need) {
      const rows = await fetchBatch(currentSkip, batch)
      if (rows.length === 0) break
      for (const ev of rows) {
        const cap = ev.capacity ?? ev.club.capacity
        const cnt = (ev._count.memberships as unknown as number) || 0
        if (typeof cap !== 'number' || cnt < cap) filtered.push(ev)
      }
      currentSkip += rows.length
      if (rows.length < batch) break
      // Safety cap to avoid unbounded loops
      if (currentSkip > 2000) break
    }
    // slice to requested page
    filtered = filtered.slice((page - 1) * limit, (page - 1) * limit + limit)
  } else {
    const rows = await fetchBatch(skip ?? 0, limit ?? 24)
    filtered = rows // no extra filtering, or hideSoldOut=false
  }

  const MONTH_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const items = filtered.map((ev) => {
    const memberCount = (ev._count.memberships as unknown as number) || 0
    const capacity = ev.capacity ?? ev.club.capacity ?? null

    // Build event label like "Kasım Oturumu —\nClub Name" (long dash + new line)
    const monthTitle = MONTH_TR[ev.startsAt.getMonth()] || 'Ay'
    const eventName = `${monthTitle} Oturumu —\n${ev.club.name}`

    return {
      id: ev.id,
      slug: ev.club.slug,
      name: eventName,
      description: ev.club.description,
      bannerUrl: ev.club.bannerUrl,
      priceTRY: ev.priceTRY ?? ev.club.priceTRY ?? 0,
      moderator: {
        id: ev.club.moderator?.id ?? '',
        name: ev.club.moderator?.name ?? '—',
        avatarUrl: ev.club.moderator?.avatarUrl ?? null,
        username: ev.club.moderator?.username ?? null,
        slug: ev.club.moderator?.slug ?? null,
      },
      memberCount,
      pickCount: ev.bookTitle ? 1 : 0,
      capacity,
    }
  })

  return NextResponse.json({
    page,
    total: null,
    limit: limit ?? null,
    items,
  })
}
