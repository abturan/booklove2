import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const sort = searchParams.get('sort') || 'members_desc'
  const limit = Number(searchParams.get('limit') || '0') || undefined

  const where: any = { published: true }
  if (q) {
    where.OR = [
      { name: { contains: q } as any },
      { moderator: { name: { contains: q } as any } },
    ]
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
      // Moderatör adı + id + avatar
      moderator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { memberships: { where: { isActive: true } as any } } },
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
      memberCount: (c._count as any).memberships,
      // Kartların okuyacağı yapı (gerçek avatar DB’de neyse o)
      moderator: {
        id: c.moderator?.id ?? '',
        name: c.moderator?.name ?? '—',
        avatarUrl: c.moderator?.avatarUrl ?? null,
      },
    }))
  )
}




