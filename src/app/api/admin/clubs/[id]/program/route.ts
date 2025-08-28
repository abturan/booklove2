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

    // Tarih doğrulama
    const startsAt = body?.startsAt ? new Date(body.startsAt) : null
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: 'Geçerli bir oturum tarihi girin' }, { status: 400 })
    }

    // Zorunlu kitap alanı
    const bookTitle: string = body?.book?.title?.trim?.() || ''
    if (!bookTitle) {
      return NextResponse.json({ error: 'Kitap adı zorunlu' }, { status: 400 })
    }

    // Aynı ay tekrarı
    const monthKey = body?.monthKey || monthKeyFromISO(startsAt.toISOString())
    const existing = await prisma.clubPick.findUnique({
      where: { clubId_monthKey: { clubId, monthKey } },
    }).catch(() => null)
    if (existing) {
      return NextResponse.json(
        { error: 'Bu ay için zaten bir program kaydı var. Farklı bir tarih seçin.' },
        { status: 409 }
      )
    }

    // Kitap: mevcutsa bul, yoksa oluştur (sende "hep create" vardı)
    let book = await prisma.book.findFirst({
      where: {
        title: bookTitle,
        author: body?.book?.author || undefined,
      },
    })

    if (!book) {
      book = await prisma.book.create({
        data: {
          title: bookTitle,
          author: body?.book?.author || null,
          translator: body?.book?.translator || null,
          pages: body?.book?.pages != null ? Number(body.book.pages) : null,
          coverUrl: body?.book?.coverUrl || null,
          isbn: body?.book?.isbn || null,
        } as any,
      })
    } else {
      // İsteğe bağlı güncelleme (yeni bilgi geldiyse)
      const patch: any = {}
      if (body?.book?.translator !== undefined) patch.translator = body.book.translator
      if (body?.book?.pages !== undefined) patch.pages = body.book.pages
      if (body?.book?.isbn !== undefined) patch.isbn = body.book.isbn
      if (body?.book?.coverUrl !== undefined) patch.coverUrl = body.book.coverUrl
      if (Object.keys(patch).length) {
        book = await prisma.book.update({ where: { id: book.id }, data: patch })
      }
    }

    // Daha önce current olanı kapat
    await prisma.clubPick.updateMany({
      where: { clubId },
      data: { isCurrent: false },
    })

    // Seçki
    const pick = await prisma.clubPick.create({
      data: {
        clubId,
        bookId: book.id,
        monthKey,
        isCurrent: true,
        note: body?.note || body?.book?.backText || null,
      },
    })

    // Etkinlik: *** description DEĞİL -> notes ***
    await prisma.clubEvent.create({
      data: {
        clubId,
        startsAt,
        title: 'Aylık Oturum',
        notes: body?.note || body?.book?.backText || null,
      } as any,
    })

    return NextResponse.json({ ok: true, book, pick }, { status: 201 })
  } catch (err: any) {
    console.error('POST /admin/clubs/[id]/program error:', err)
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}
