// src/app/api/admin/clubs/[id]/program/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function monthKeyFromISO(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const clubId = params.id
  const body = await req.json()

  const startsAt = body?.startsAt ? new Date(body.startsAt) : null
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'Geçerli bir oturum tarihi girin' }, { status: 400 })
  }

  const bookTitle: string = body?.book?.title?.trim?.() || ''
  if (!bookTitle) {
    return NextResponse.json({ error: 'Kitap adı zorunlu' }, { status: 400 })
  }

  // kitap
  const book = await prisma.book.create({
    data: {
      title: bookTitle,
      author: body?.book?.author || null,
      translator: body?.book?.translator || null,
      pages: body?.book?.pages != null ? Number(body.book.pages) : null,
      coverUrl: body?.book?.coverUrl || null,
      isbn: body?.book?.isbn || null,
    } as any,
  })

  const monthKey = body?.monthKey || monthKeyFromISO(startsAt.toISOString())

  await prisma.clubPick.updateMany({
    where: { clubId },
    data: { isCurrent: false },
  })

  const pick = await prisma.clubPick.create({
    data: {
      clubId,
      bookId: book.id,
      monthKey,
      isCurrent: true,
      note: body?.note || null,
    },
  })

  await prisma.clubEvent.create({
    data: {
      clubId,
      startsAt,
      title: 'Aylık Oturum',
      description: body?.note || null,
    } as any,
  })

  return NextResponse.json({ ok: true, book, pick })
}
