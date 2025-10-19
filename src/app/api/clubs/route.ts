// src/app/api/clubs/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  const meId = session?.user?.id || null

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const sort = searchParams.get('sort') || 'members_desc'
  const limit = Number(searchParams.get('limit') || '0') || undefined
  const subscribed = searchParams.get('subscribed') === '1'

  const where: any = { published: true }

  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean)
    if (tokens.length > 0) {
      where.AND = tokens.map((tok) => ({
        OR: [
          { name: { contains: tok, mode: 'insensitive' } },
          { moderator: { name: { contains: tok, mode: 'insensitive' } } },
        ],
      }))
    }
  }

  if (subscribed && meId) {
    where.memberships = { some: { userId: meId, isActive: true } }
  }

  let orderBy: any
  if (sort === 'members_desc') orderBy = { memberships: { _count: 'desc' } }
  else if (sort === 'members_asc') orderBy = { memberships: { _count: 'asc' } }
  else if (sort === 'created_desc') orderBy = { updatedAt: 'desc' }
  else if (sort === 'created_asc') orderBy = { updatedAt: 'asc' }

  const clubs = await prisma.club.findMany({
    where,
    orderBy,
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      bannerUrl: true,
      priceTRY: true,
      capacity: true,
      moderator: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      _count: { select: { memberships: { where: { isActive: true } }, picks: true } },
    },
  })

  return NextResponse.json(
    clubs.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      bannerUrl: c.bannerUrl,
      priceTRY: c.priceTRY,
      memberCount: c._count.memberships as unknown as number,
      pickCount: (c._count.picks as unknown as number) ?? 0,
      capacity: c.capacity ?? null,
      moderator: {
        id: c.moderator?.id ?? '',
        name: c.moderator?.name ?? '—',
        avatarUrl: c.moderator?.avatarUrl ?? null,
        username: c.moderator?.username ?? null,
        slug: c.moderator?.slug ?? null,
      },
    }))
  )
}
