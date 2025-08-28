import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const qRaw = (searchParams.get('q') || '').trim()
  if (!qRaw) return NextResponse.json({ users: [] })

  // connector case-insensitive desteklemiyor olabilir → basit varyasyonlar + sonradan filtre
  const variants = Array.from(
    new Set([
      qRaw,
      qRaw.toLowerCase(),
      qRaw.toUpperCase(),
      qRaw[0]?.toUpperCase() + qRaw.slice(1).toLowerCase(),
    ])
  )

  const users = await prisma.user.findMany({
    where: {
      OR: variants.flatMap((v) => [
        { name: { contains: v } },
        { email: { contains: v } },
      ]),
    },
    orderBy: { name: 'asc' },
    take: 50,
    select: { id: true, name: true, email: true },
  })

  const lc = qRaw.toLowerCase()
  const filtered = users
    .filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(lc)) ||
        (u.email && u.email.toLowerCase().includes(lc))
    )
    .slice(0, 10)

  return NextResponse.json({ users: filtered })
}
