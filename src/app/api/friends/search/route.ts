// src/app/api/friends/search/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listFollowData } from '@/lib/follow'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const me = session.user.id

  const { searchParams } = new URL(req.url)
  const q = String(searchParams.get('q') || '').trim()
  const take = Math.min(Number(searchParams.get('take') || 20), 50)

  const { followers, following } = await listFollowData(me)
  const followerSet = new Set(followers.map((f) => f.id))
  const mutualIds = following.filter((f) => followerSet.has(f.id)).map((f) => f.id)

  if (mutualIds.length === 0) return NextResponse.json({ items: [] })

  const users = await prisma.user.findMany({
    where: {
      id: { in: mutualIds },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, username: true, avatarUrl: true },
    orderBy: [{ name: 'asc' }, { username: 'asc' }],
    take,
  })

  return NextResponse.json({ items: users })
}
