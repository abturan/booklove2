// src/app/api/clubs/search/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '12', 10) || 12, 1), 60)
    const onlySubscribed = searchParams.get('subscribed') === '1'

    const session = await auth()
    const meId = session?.user?.id || null

    const whereBase: any = {
      published: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { moderator: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    let where = whereBase

    if (onlySubscribed && meId) {
      where = {
        ...whereBase,
        memberships: { some: { userId: meId, isActive: true } },
      }
    }

    const [total, items] = await Promise.all([
      prisma.club.count({ where }),
      prisma.club.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          bannerUrl: true,
          moderator: { select: { id: true, name: true, username: true, avatarUrl: true} },
          subscriptions: { where: { active: true }, select: { id: true } },
        },
      }),
    ])

    return NextResponse.json({ ok: true, page, pageSize, total, items })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, message: 'Sunucu hatası' }, { status: 500 })
  }
}
