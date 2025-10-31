import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })

  const updates: any = {}

  if (body.startsAt !== undefined) {
    const startsAt = body.startsAt ? new Date(body.startsAt) : null
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: 'Geçerli bir tarih girin' }, { status: 400 })
    }
    updates.startsAt = startsAt
  }

  if (body.title !== undefined) {
    const title = String(body.title || '').trim()
    updates.title = title || 'Aylık Oturum'
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes ? String(body.notes) : null
  }

  if (body.priceTRY !== undefined) {
    if (body.priceTRY === null || body.priceTRY === '') {
      updates.priceTRY = null
    } else {
      const price = Number(body.priceTRY)
      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'Geçerli bir etkinlik ücreti girin' }, { status: 400 })
      }
      updates.priceTRY = price
    }
  }

  if (body.capacity !== undefined) {
    if (body.capacity === null || body.capacity === '') {
      updates.capacity = null
    } else {
      const cap = Number(body.capacity)
      if (!Number.isInteger(cap) || cap < 0) {
        return NextResponse.json({ error: 'Kapasite 0 veya pozitif tam sayı olmalı' }, { status: 400 })
      }
      updates.capacity = cap
    }
  }

  if (body.book) {
    const title = String(body.book?.title || '').trim()
    if (!title) {
      return NextResponse.json({ error: 'Kitap adı zorunlu.' }, { status: 400 })
    }

    const pagesRaw = body.book?.pages
    const pages =
      pagesRaw === null || pagesRaw === undefined || pagesRaw === ''
        ? null
        : Number(pagesRaw)
    if (pages !== null && (Number.isNaN(pages) || pages < 0)) {
      return NextResponse.json({ error: 'Geçerli bir sayfa sayısı girin' }, { status: 400 })
    }

    updates.bookTitle = title
    updates.bookAuthor = body.book?.author ? String(body.book.author) : null
    updates.bookTranslator = body.book?.translator ? String(body.book.translator) : null
    updates.bookPages = pages
    updates.bookIsbn = body.book?.isbn ? String(body.book.isbn) : null
    updates.bookCoverUrl = body.book?.coverUrl ? String(body.book.coverUrl) : null
  }

  const shouldUpdateEvent = Object.keys(updates).length > 0

  try {
    const event = shouldUpdateEvent
      ? await prisma.clubEvent.update({
          where: { id: params.id },
          data: updates,
          select: {
            id: true,
            clubId: true,
            startsAt: true,
            title: true,
            notes: true,
            priceTRY: true,
            capacity: true,
            bookTitle: true,
            bookAuthor: true,
            bookTranslator: true,
            bookPages: true,
            bookIsbn: true,
            bookCoverUrl: true,
          },
        })
      : await prisma.clubEvent.findUnique({
          where: { id: params.id },
          select: {
            id: true,
            clubId: true,
            startsAt: true,
            title: true,
            notes: true,
            priceTRY: true,
            capacity: true,
            bookTitle: true,
            bookAuthor: true,
            bookTranslator: true,
            bookPages: true,
            bookIsbn: true,
            bookCoverUrl: true,
          },
        })

    return NextResponse.json({ ok: true, event })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const eventId = params.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.clubEvent.findUnique({
        where: { id: eventId },
        select: { id: true },
      })

      if (!event) {
        throw new Error('NOT_FOUND')
      }

      const room = await tx.chatRoom.findUnique({
        where: { clubEventId: eventId },
        select: { id: true },
      })

      if (room) {
        await tx.chatMessage.deleteMany({ where: { roomId: room.id } })
        await tx.chatRoom.delete({ where: { id: room.id } })
      }

      await tx.membership.deleteMany({ where: { clubEventId: eventId } })
      await tx.subscription.deleteMany({ where: { clubEventId: eventId } })
      await tx.paymentIntent.deleteMany({ where: { clubEventId: eventId } })

      await tx.clubEvent.delete({ where: { id: eventId } })

      return { ok: true }
    })

    return NextResponse.json(result)
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Etkinlik bulunamadı.' }, { status: 404 })
    }
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}
