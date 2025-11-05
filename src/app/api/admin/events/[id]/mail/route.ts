// src/app/api/admin/events/[id]/mail/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildEventMail } from '@/lib/eventMailTemplate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Body = {
  note?: string
  saveOnly?: boolean
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const user = session?.user
    if (!user || (user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const note = typeof body?.note === 'string' ? body.note : ''
    const saveOnly = Boolean(body?.saveOnly)

    const event = await prisma.clubEvent.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        startsAt: true,
        club: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || '').replace(/\/$/, '')
    const cta = `${base || 'https://boook.love'}/clubs/${event.club.slug}`
    const eventDate = new Date(event.startsAt)

    const generic = buildEventMail({
      clubName: event.club.name,
      eventTitle: event.title,
      eventDate,
      note,
      recipientName: null,
      ctaUrl: cta,
    })

    if (!saveOnly) {
      return NextResponse.json(
        { error: 'Mail gönderimi bu uç noktadan yapılamaz. Lütfen önce taslak oluşturun.' },
        { status: 400 },
      )
    }

    const mail = await prisma.eventMail.create({
      data: {
        eventId: event.id,
        subject: generic.subject,
        previewText: generic.previewText,
        bodyHtml: generic.html,
        note,
        sendScope: 'DRAFT',
        createdById: user.id ? String(user.id) : null,
      },
    })

    return NextResponse.json({
      mail: {
        id: mail.id,
        createdAt: mail.createdAt,
        subject: mail.subject,
        previewText: mail.previewText,
        note: mail.note,
      },
      recipients: [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
