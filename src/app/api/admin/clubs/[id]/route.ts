// src/app/api/admin/clubs/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { relaxClubModeratorConstraint } from '@/lib/relaxModeratorConstraint'
import { ensureConferenceFlagColumn } from '@/lib/conferenceFlag'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  await ensureConferenceFlagColumn()

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
      capacity: true,
      conferenceEnabled: true,
      moderator: { select: { id: true, name: true, email: true } },
      _count: { select: { memberships: { where: { isActive: true } as any } } },
      events: { orderBy: { startsAt: 'desc' }, take: 1 },
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

  await ensureConferenceFlagColumn()
  const body = await req.json()
  const name: string = (body.name || '').trim()
  const description: string = body.description || ''
  const priceTRY: number = Number(body.priceTRY || 0)
  const bannerUrl: string = body.bannerUrl || ''
  const moderatorId: string | undefined = body.moderatorId
  const forceTransfer: boolean = !!body.forceTransfer
  const capacityRaw = body.capacity
  const capacity: number | null =
    capacityRaw === null || capacityRaw === '' || capacityRaw === undefined
      ? null
      : Number(capacityRaw)
  const conferenceEnabled = Boolean(body.conferenceEnabled)

  if (!name) return NextResponse.json('Kulüp adı zorunlu', { status: 400 })
  if (!moderatorId) return NextResponse.json('Moderatör seçin', { status: 400 })
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
    return NextResponse.json('Kapasite 0 veya pozitif tam sayı olmalı (boş = sınırsız).', { status: 400 })
  }

  const [current, moderatorUser] = await Promise.all([
    prisma.club.findUnique({
      where: { id: params.id },
      select: { moderatorId: true },
    }),
    prisma.user.findUnique({ where: { id: moderatorId }, select: { id: true, role: true } }),
  ])
  if (!current) return NextResponse.json('Kulüp bulunamadı', { status: 404 })
  if (!moderatorUser) return NextResponse.json('Seçilen moderatör bulunamadı', { status: 404 })

  const moderatorIsAdmin = String(moderatorUser.role || '').toUpperCase() === 'ADMIN'
  if (moderatorIsAdmin) await relaxClubModeratorConstraint()

  const willChangeModerator = current.moderatorId !== moderatorId

  if (willChangeModerator && !moderatorIsAdmin) {
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
        if (!current.moderatorId) {
          throw new Error('Mevcut kulübün eski moderatörü bulunamadı.')
        }
        await tx.club.update({
          where: { id: other.id },
          data: { moderatorId: current.moderatorId },
        })

        await tx.user.update({
          where: { id: moderatorId },
          data: { role: moderatorIsAdmin ? (moderatorUser.role as any) : ('MODERATOR' as any) },
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
            capacity,
            conferenceEnabled,
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
      data: { role: moderatorIsAdmin ? (moderatorUser.role as any) : ('MODERATOR' as any) },
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
        capacity,
        conferenceEnabled,
      },
      select: { id: true, slug: true },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  })
  if (!club) {
    return NextResponse.json({ error: 'Kulüp bulunamadı' }, { status: 404 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const events = await tx.clubEvent.findMany({
        where: { clubId: params.id },
        select: { id: true },
      })
      const eventIds = events.map((e) => e.id)

      const chatRooms = await tx.chatRoom.findMany({
        where: {
          OR: [
            { clubId: params.id },
            ...(eventIds.length ? [{ clubEventId: { in: eventIds } }] : []),
          ],
        },
        select: { id: true },
      })
      const roomIds = chatRooms.map((r) => r.id)

      if (roomIds.length) {
        await tx.chatMessage.deleteMany({ where: { roomId: { in: roomIds } } })
      }
      if (chatRooms.length) {
        await tx.chatRoom.deleteMany({ where: { id: { in: roomIds } } })
      }

      await tx.membership.deleteMany({ where: { clubId: params.id } })
      await tx.subscription.deleteMany({ where: { clubId: params.id } })
      await tx.paymentIntent.deleteMany({ where: { clubId: params.id } })
      if (eventIds.length) {
        await tx.clubEvent.deleteMany({ where: { id: { in: eventIds } } })
      }
      await tx.club.delete({ where: { id: params.id } })
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/admin/clubs/[id] error:', err)
    return NextResponse.json({ error: err?.message || 'Kulüp silinemedi' }, { status: 500 })
  }
}
