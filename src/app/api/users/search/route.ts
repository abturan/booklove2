// src/app/api/users/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Math.max(1, Math.min(10, Number(searchParams.get('limit') || 6)))
    if (!q) {
      return NextResponse.json({ items: [] }, { status: 200 })
    }
    const items = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ name: 'asc' }],
      take: limit,
      select: { id: true, name: true, username: true, slug: true, avatarUrl: true },
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: 'search_failed' }, { status: 500 })
  }
}
