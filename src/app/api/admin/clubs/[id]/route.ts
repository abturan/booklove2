import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      bannerUrl: true,
      priceTRY: true,
      published: true,
      moderatorId: true,
      moderator: { select: { id: true, name: true, email: true } },
      _count: { select: { memberships: { where: { isActive: true } as any } } },
      picks: {
        orderBy: { monthKey: 'desc' },
        include: { book: true },
      },
      events: {
        orderBy: { startsAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!club) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({
    ...club,
    memberCount: (club._count as any).memberships,
  })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const name: string = (body.name || '').trim()
  const description: string = body.description || ''
  const priceTRY: number = Number(body.priceTRY || 0)
  const bannerUrl: string = body.bannerUrl || ''
  const moderatorId: string | undefined = body.moderatorId
  const forceTransfer: boolean = !!body.forceTransfer

  if (!name) return NextResponse.json('Kulüp adı zorunlu', { status: 400 })
  if (!moderatorId) return NextResponse.json('Moderatör seçin', { status: 400 })

  const current = await prisma.club.findUnique({
    where: { id: params.id },
    select: { moderatorId: true },
  })
  if (!current) return NextResponse.json('Kulüp bulunamadı', { status: 404 })

  const willChangeModerator = current.moderatorId !== moderatorId

  if (willChangeModerator) {
    const other = await prisma.club.findFirst({
      where: { moderatorId, NOT: { id: params.id } },
      select: { id: true, name: true },
    })

    if (other) {
      if (!forceTransfer) {
        return NextResponse.json(
          `Seçtiğiniz kullanıcı zaten "${other.name}" kulübünün moderatörü. Başka bir kullanıcı seçin veya forceTransfer:true gönderin.`,
          { status: 409 }
        )
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.club.update({
          where: { id: other.id },
          data: { moderatorId: null },
        })
        await tx.user.update({
          where: { id: moderatorId },
          data: { role: 'MODERATOR' as any },
        })
        return tx.club.update({
          where: { id: params.id },
          data: {
            name,
            slug: slugify(name),
            description,
            priceTRY,
            bannerUrl,
            moderatorId,
          },
          select: { id: true, slug: true },
        })
      })

      return NextResponse.json(updated)
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: moderatorId },
      data: { role: 'MODERATOR' as any },
    })
    return tx.club.update({
      where: { id: params.id },
      data: {
        name,
        slug: slugify(name),
        description,
        priceTRY,
        bannerUrl,
        moderatorId,
      },
      select: { id: true, slug: true },
    })
  })

  return NextResponse.json(updated)
}
