// src/app/api/admin/picks/[pickId]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function monthKeyFromISO(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function PATCH(
  req: Request,
  { params }: { params: { pickId: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const startsAt: string | null = body?.startsAt || null
  const note: string | null = body?.note ?? null
  const book = body?.book ?? {}

  const pick = await prisma.clubPick.findUnique({
    where: { id: params.pickId },
    select: { id: true, clubId: true, bookId: true, monthKey: true, isCurrent: true },
  })
  if (!pick) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let newMonthKey: string | null = null
  if (startsAt) {
    const mk = monthKeyFromISO(startsAt)
    if (!mk) return NextResponse.json({ error: 'Geçerli tarih girin' }, { status: 400 })
    newMonthKey = mk
  }

  const updated = await prisma.$transaction(async (tx) => {
    // kitap güncelle
    await tx.book.update({
      where: { id: pick.bookId },
      data: {
        title: (book.title ?? '').toString(),
        author: book.author ?? null,
        translator: book.translator ?? null,
        pages: book.pages != null ? Number(book.pages) : null,
        coverUrl: book.coverUrl ?? null,
        isbn: book.isbn ?? null,
      } as any,
    })

    // pick güncelle
    const pickUpd = await tx.clubPick.update({
      where: { id: pick.id },
      data: {
        note,
        ...(newMonthKey ? { monthKey: newMonthKey } : {}),
      },
    })

    // tarih gelmişse etkinliği senkronla ve bu pick'i güncel yap
    if (startsAt) {
      const startDate = new Date(startsAt)

      // aynı ay için bir event bul (varsa güncelle, yoksa oluştur)
      const existing = await tx.clubEvent.findFirst({
        where: { clubId: pick.clubId },
        orderBy: { startsAt: 'desc' },
      })

      if (existing && monthKeyFromISO(existing.startsAt.toISOString()) === (newMonthKey || pick.monthKey)) {
        await tx.clubEvent.update({
          where: { id: existing.id },
          data: { startsAt: startDate, description: note } as any,
        })
      } else {
        await tx.clubEvent.create({
          data: {
            clubId: pick.clubId,
            startsAt: startDate,
            title: 'Aylık Oturum',
            description: note,
          } as any,
        })
      }

      await tx.clubPick.updateMany({ where: { clubId: pick.clubId }, data: { isCurrent: false } })
      await tx.clubPick.update({ where: { id: pick.id }, data: { isCurrent: true } })
    }

    return pickUpd
  })

  return NextResponse.json({ ok: true, id: updated.id })
}

export async function DELETE(
  req: Request,
  { params }: { params: { pickId: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const pick = await prisma.clubPick.findUnique({
    where: { id: params.pickId },
    select: { id: true, clubId: true, isCurrent: true },
  })
  if (!pick) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.clubPick.delete({ where: { id: pick.id } })

    if (pick.isCurrent) {
      const latest = await tx.clubPick.findFirst({
        where: { clubId: pick.clubId },
        orderBy: { monthKey: 'desc' },
      })
      if (latest) {
        await tx.clubPick.update({ where: { id: latest.id }, data: { isCurrent: true } })
      }
    }
  })

  return NextResponse.json({ ok: true })
}
