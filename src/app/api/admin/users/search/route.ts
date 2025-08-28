// src/app/api/admin/users/search/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ items: [] })

  // Not: Bazı Prisma kurulumlarında StringFilter'da `mode` yok (tip hatası veriyor).
  // Bu yüzden case-insensitive için `mode` kullanmadan, hem ad hem e-posta üzerinden arıyoruz.
  const items = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
      ],
    },
    take: 20,
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json({ items })
}
