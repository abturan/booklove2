import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const sort = searchParams.get('sort') || 'members_desc'

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
    select: {
      id: true, slug: true, name: true, description: true, bannerUrl: true, priceTRY: true,
      moderator: { select: { name: true } },
      _count: { select: { memberships: { where: { isActive: true } as any } } },
    },
  })

  return NextResponse.json(
    clubs.map((c) => ({ ...c, memberCount: (c._count as any).memberships }))
  )
}
