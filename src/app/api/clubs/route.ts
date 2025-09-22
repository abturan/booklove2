// src/app/api/clubs/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Arama sonuçlarında stale cache olmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

// Türkçe duyarlı normalize: i/İ ve aksan farklarını azaltır
function normalizeTR(s: string) {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // diacritics
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .toLowerCase()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const qNorm = normalizeTR(q)
  const sort = searchParams.get('sort') || 'members_desc'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

  // DB ön filtre (insensitive). Not: bazı veritabanlarında TR i/İ tam eşleşmeyebilir;
  // bu yüzden aşağıda JS tarafında normalize ederek ikinci kez filtreliyoruz.
  const where: any = { published: true }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } as any },
      { slug: { contains: q, mode: 'insensitive' } as any },
      { description: { contains: q, mode: 'insensitive' } as any },
      { moderator: { name: { contains: q, mode: 'insensitive' } as any } },
    ]
  }

  // "Üye sayısı" aktif üyelik sayısı ile hesaplandığı için,
  // Prisma orderBy ile relation _count(where) kullanamıyoruz.
  // Bu yüzden fazla kayıt çekip JS tarafında sıralama yapıyoruz.
  const prefetchTake = Math.max(limit * 3, 60)

  // created/updated sıralamasında DB orderBy kullan; diğerlerinde sonra JS'te sıralayacağız
  let prismaOrderBy: any = undefined
  if (sort === 'created_desc') prismaOrderBy = { updatedAt: 'desc' }
  else if (sort === 'created_asc') prismaOrderBy = { updatedAt: 'asc' }

  const rows = await prisma.club.findMany({
    where,
    ...(prismaOrderBy ? { orderBy: prismaOrderBy } : {}),
    take: prefetchTake,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      bannerUrl: true,
      priceTRY: true,
      updatedAt: true,
      moderator: { select: { name: true } },
      _count: {
        select: {
          // yalnızca aktif üyelikleri say
          memberships: { where: { isActive: true } as any },
        },
      },
    },
  })

  // JS tarafında TR-normalize filtre (DB insensitive'e ek güvenlik)
  const filtered = q
    ? rows.filter((r) => {
        const hay =
          (r.name || '') +
          ' ' +
          (r.slug || '') +
          ' ' +
          (r.description || '') +
          ' ' +
          (r.moderator?.name || '')
        return normalizeTR(hay).includes(qNorm)
      })
    : rows

  // Üye sayısını hesapla
  const withMemberCount = filtered.map((c) => ({
    ...c,
    memberCount: (c._count as any)?.memberships ?? 0,
  }))

  // Sıralama (üyeye göre olanlar burada)
  let sorted = withMemberCount
  if (sort === 'members_desc') {
    sorted = withMemberCount.sort((a, b) => b.memberCount - a.memberCount || a.name.localeCompare(b.name))
  } else if (sort === 'members_asc') {
    sorted = withMemberCount.sort((a, b) => a.memberCount - b.memberCount || a.name.localeCompare(b.name))
  } else if (sort === 'created_desc') {
    // DB zaten updatedAt desc getirdi; yine de stabil olsun diye isimle tie-break
    sorted = withMemberCount.sort(
      (a, b) =>
        (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) ||
        a.name.localeCompare(b.name),
    )
  } else if (sort === 'created_asc') {
    sorted = withMemberCount.sort(
      (a, b) =>
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) ||
        a.name.localeCompare(b.name),
    )
  }

  // Sayfalama
  const sliced = sorted.slice(offset, offset + limit)

  // Çıkış: önceki yapıyı bozmadan memberCount ekleyerek dön
  return NextResponse.json(sliced, {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}







