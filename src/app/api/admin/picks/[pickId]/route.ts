// src/app/api/admin/picks/[pickId]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { pickId?: string; id?: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const eventId = (params as any).pickId ?? (params as any).id
  if (!eventId) return NextResponse.json({ error: 'missing event id' }, { status: 400 })

  const event = await prisma.clubEvent.findUnique({
    where: { id: eventId },
    select: { id: true, clubId: true },
  })
  if (!event) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const updates: any = {}

  if (body.startsAt !== undefined) {
    if (!body.startsAt) {
      return NextResponse.json({ error: 'invalid date' }, { status: 400 })
    }
    const d = new Date(body.startsAt)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'invalid date' }, { status: 400 })
    }
    updates.startsAt = d
  }

  if (body.book) {
    const title = String(body.book.title || '').trim()
    if (!title) {
      return NextResponse.json({ error: 'Kitap adı zorunlu.' }, { status: 400 })
    }

    const pages =
      body.book.pages === null || body.book.pages === undefined || body.book.pages === ''
        ? null
        : Number(body.book.pages)
    if (pages !== null && (Number.isNaN(pages) || pages < 0)) {
      return NextResponse.json({ error: 'Geçerli sayfa sayısı girin.' }, { status: 400 })
    }

    updates.bookTitle = title
    updates.bookAuthor = body.book.author ? String(body.book.author) : null
    updates.bookTranslator = body.book.translator ? String(body.book.translator) : null
    updates.bookPages = pages
    updates.bookIsbn = body.book.isbn ? String(body.book.isbn) : null
    updates.bookCoverUrl = body.book.coverUrl ? String(body.book.coverUrl) : null
  }

  if (body.note !== undefined) {
    updates.notes = body.note ? String(body.note) : null
  }

  if (body.priceTRY !== undefined) {
    if (body.priceTRY === null || body.priceTRY === '') {
      updates.priceTRY = null
    } else {
      const price = Number(body.priceTRY)
      if (Number.isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'Geçerli bir ücret girin.' }, { status: 400 })
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
        return NextResponse.json({ error: 'Kapasite 0 veya pozitif tam sayı olmalı.' }, { status: 400 })
      }
      updates.capacity = cap
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  await prisma.clubEvent.update({ where: { id: event.id }, data: updates })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { pickId?: string; id?: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const eventId = (params as any).pickId ?? (params as any).id
  if (!eventId) return NextResponse.json({ error: 'missing event id' }, { status: 400 })

  const event = await prisma.clubEvent.findUnique({
    where: { id: eventId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'not found' }, { status: 404 })

  await prisma.clubEvent.delete({ where: { id: event.id } })
  return NextResponse.json({ ok: true })
}
