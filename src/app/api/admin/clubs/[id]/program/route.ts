import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Notification } from '@prisma/client'

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const clubId = params.id
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    }

    const startsAt = body?.startsAt ? new Date(body.startsAt) : null
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: 'Geçerli bir oturum tarihi girin' }, { status: 400 })
    }

    const bookTitle: string = body?.book?.title?.trim?.() || ''
    if (!bookTitle) {
      return NextResponse.json({ error: 'Kitap adı zorunlu' }, { status: 400 })
    }

    const priceTryRaw = body?.priceTRY
    const capacityRaw = body?.capacity

    const priceTRY =
      priceTryRaw === null || priceTryRaw === undefined || priceTryRaw === ''
        ? null
        : Number(priceTryRaw)
    if (priceTRY !== null && (Number.isNaN(priceTRY) || priceTRY < 0)) {
      return NextResponse.json({ error: 'Geçerli bir etkinlik ücreti girin' }, { status: 400 })
    }

    const capacity =
      capacityRaw === null || capacityRaw === undefined || capacityRaw === ''
        ? null
        : Number(capacityRaw)
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) {
      return NextResponse.json({ error: 'Kapasite 0 veya pozitif tam sayı olmalı' }, { status: 400 })
    }

    const pagesRaw = body?.book?.pages
    const pages =
      pagesRaw === null || pagesRaw === undefined || pagesRaw === ''
        ? null
        : Number(pagesRaw)
    if (pages !== null && (Number.isNaN(pages) || pages < 0)) {
      return NextResponse.json({ error: 'Geçerli bir sayfa sayısı girin' }, { status: 400 })
    }

    const event = await prisma.clubEvent.create({
      data: {
        clubId,
        startsAt,
        title: 'Aylık Oturum',
        notes: body?.note || body?.book?.backText || null,
        priceTRY: priceTRY ?? undefined,
        capacity: capacity ?? undefined,
        bookTitle,
        bookAuthor: body?.book?.author ? String(body.book.author) : null,
        bookTranslator: body?.book?.translator ? String(body.book.translator) : null,
        bookPages: pages,
        bookIsbn: body?.book?.isbn ? String(body.book.isbn) : null,
        bookCoverUrl: body?.book?.coverUrl ? String(body.book.coverUrl) : null,
      },
      select: { id: true },
    })

    // Notify past participants of this club about new event
    try {
      const members = await prisma.membership.findMany({
        where: { clubId, isActive: true },
        distinct: ['userId'],
        select: { userId: true },
      })
      if (members.length > 0) {
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { name: true, slug: true } })
        const payloadObj = { clubId, eventId: event.id, clubName: club?.name ?? 'Kulüp', url: `/clubs/${club?.slug || ''}` }
        const payload = JSON.stringify(payloadObj)
        await prisma.notification.createMany({
          data: members.map((m) => ({ userId: m.userId, type: 'club_new_event', payload })),
        })
        // email
        const { sendNotificationEmail } = await import('@/lib/notify-email')
        for (const m of members) {
          sendNotificationEmail(m.userId, 'club_new_event', payloadObj).catch(() => {})
        }
      }
    } catch (err) {
      console.error('notify new event error', err)
    }

    return NextResponse.json({ ok: true, event }, { status: 201 })
  } catch (err: any) {
    console.error('POST /admin/clubs/[id]/program error:', err)
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}
