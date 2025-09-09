// src/app/api/contracts/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

import PDFDocument from 'pdfkit/js/pdfkit.standalone.js'
import { renderContractPdf } from '@/lib/contract'
import fs from 'node:fs'
import path from 'node:path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const { clubId } = await req.json()

    const [user, club] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, city: true, district: true, phone: true },
      }),
      prisma.club.findUnique({
        where: { id: clubId },
        select: { priceTRY: true },
      }),
    ])

    if (!user || !club) {
      return NextResponse.json({ ok: false, error: 'Kayıt bulunamadı' }, { status: 404 })
    }
    if (!user.city || !user.district || !user.phone) {
      return NextResponse.json({ ok: false, error: 'Eksik profil bilgisi' }, { status: 400 })
    }

    const doc = new (PDFDocument as any)({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (e: any) => reject(e))
    })

    // ---- Unicode Türkçe fontları yükle ----
    const fontDir = path.join(process.cwd(), 'public', 'fonts')
    const regularPath = path.join(fontDir, 'NotoSans-Regular.ttf')
    const boldPath = path.join(fontDir, 'NotoSans-Bold.ttf')

    try {
      const regular = fs.readFileSync(regularPath)
      const bold = fs.readFileSync(boldPath)
      doc.registerFont('UI', regular)
      doc.registerFont('UI-Bold', bold)
    } catch {
      return NextResponse.json(
        {
          ok: false,
          code: 'FONT_MISSING',
          error:
            'PDF için Türkçe uyumlu fontlar eksik. Lütfen public/fonts içine NotoSans-Regular.ttf ve NotoSans-Bold.ttf dosyalarını ekleyin.',
          detail: `Beklenen yollar: ${regularPath} , ${boldPath}`,
        },
        { status: 500 },
      )
    }

    renderContractPdf(
      doc,
      {
        buyerName: user.name,
        buyerEmail: user.email!,
        buyerPhone: user.phone!,
        city: user.city!,
        district: user.district!,
        priceTRY: club.priceTRY,
        startDateISO: new Date().toISOString(),
      },
      { fontRegular: 'UI', fontBold: 'UI-Bold' },
    )

    doc.end()
    const pdf = await done

    // → Buffer'ı yeni bir ArrayBuffer'a kopyala (SharedArrayBuffer sendromundan kaçınmak için)
    const ab = new ArrayBuffer(pdf.length)
    new Uint8Array(ab).set(pdf)

    // Blob ile tip güvenli dönüş
    const blob = new Blob([ab], { type: 'application/pdf' })
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="mesafeli-satis-sozlesmesi.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'PDF üretilemedi', detail: e?.message || String(e) },
      { status: 500 },
    )
  }
}
