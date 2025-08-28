import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function findClub(idOrSlug: string) {
  return prisma.club.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true, slug: true },
  })
}

async function upsertMembership(userId: string, clubId: string) {
  await prisma.membership.upsert({
    where: { userId_clubId: { userId, clubId } },
    update: { isActive: true },
    create: { userId, clubId, isActive: true },
  })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const club = await findClub(params.id)
  if (!club) return NextResponse.redirect(new URL('/', req.url))

  const session = await auth()
  if (!session?.user?.id) {
    const cb = `/clubs/${club.slug}#subscribe`
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(cb)}`, req.url))
  }
  await upsertMembership(session.user.id, club.id)
  return NextResponse.redirect(new URL(`/clubs/${club.slug}#subscribed`, req.url))
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 })

  const club = await findClub(params.id)
  if (!club) return NextResponse.json({ ok: false }, { status: 404 })

  await upsertMembership(session.user.id, club.id)
  return NextResponse.json({ ok: true, clubId: club.id, slug: club.slug })
}
