// src/app/api/admin/picks/[pickId]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function monthKeyFromISO(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthRangeUTC(monthKey: string) {
  const [y, m] = monthKey.split('-').map(n => parseInt(n, 10))
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0))
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0))
  return { start, end }
}

export async function PATCH(req: Request, { params }: { params: { pickId?: string; id?: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const pickId = (params as any).pickId ?? (params as any).id
  if (!pickId) return NextResponse.json({ error: 'missing pick id' }, { status: 400 })

  const pick = await prisma.clubPick.findUnique({
    where: { id: pickId },
    select: { id: true, clubId: true, monthKey: true, bookId: true, note: true },
  })
  if (!pick) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (body.book) {
    await prisma.book.update({
      where: { id: pick.bookId },
      data: {
        title: body.book.title ?? undefined,
        author: body.book.author ?? undefined,
        translator: body.book.translator ?? undefined,
        pages: body.book.pages ?? undefined,
        coverUrl: body.book.coverUrl ?? undefined,
        isbn: body.book.isbn ?? undefined,
      } as any,
    })
  }

  if (body.note !== undefined) {
    await prisma.clubPick.update({
      where: { id: pick.id },
      data: { note: body.note },
    })
  }

  if (body.startsAt) {
    const d = new Date(body.startsAt)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'invalid date' }, { status: 400 })
    }
    const oldRange = monthRangeUTC(pick.monthKey)
    const existingEvent = await prisma.clubEvent.findFirst({
      where: { clubId: pick.clubId, startsAt: { gte: oldRange.start, lt: oldRange.end } },
      select: { id: true },
    })
    if (existingEvent) {
      await prisma.clubEvent.update({ where: { id: existingEvent.id }, data: { startsAt: d } })
    } else {
      await prisma.clubEvent.create({
        data: {
          clubId: pick.clubId,
          startsAt: d,
          title: 'Aylık Oturum',
          notes: body.note ?? pick.note ?? null,
        } as any,
      })
    }

    const newMonthKey = monthKeyFromISO(d.toISOString())
    if (newMonthKey !== pick.monthKey) {
      const conflict = await prisma.clubPick.findUnique({
        where: { clubId_monthKey: { clubId: pick.clubId, monthKey: newMonthKey } },
        select: { id: true },
      })
      if (conflict) {
        return NextResponse.json({ error: 'bu ay için başka bir program var' }, { status: 409 })
      }
      await prisma.clubPick.update({
        where: { id: pick.id },
        data: { monthKey: newMonthKey },
      })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { pickId?: string; id?: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const pickId = (params as any).pickId ?? (params as any).id
  if (!pickId) return NextResponse.json({ error: 'missing pick id' }, { status: 400 })

  const pick = await prisma.clubPick.findUnique({
    where: { id: pickId },
    select: { id: true, clubId: true, monthKey: true },
  })
  if (!pick) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { start, end } = monthRangeUTC(pick.monthKey)
  const ev = await prisma.clubEvent.findFirst({
    where: { clubId: pick.clubId, startsAt: { gte: start, lt: end } },
    select: { id: true },
  })
  if (ev) {
    await prisma.clubEvent.delete({ where: { id: ev.id } })
  }

  await prisma.clubPick.delete({ where: { id: pick.id } })
  return NextResponse.json({ ok: true })
}
