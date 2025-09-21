import { NextRequest, NextResponse } from 'next/server'

// Direct subscribe kapatıldı; tüm akış PayTR üzerinden yürütülmeli.
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(
    {
      ok: false,
      reason: 'Direct subscribe devre dışı. Lütfen PayTR ödeme akışını kullanın.',
    },
    { status: 410 }
  )
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Eski linklere tıklanırsa ana sayfaya yönlendir.
  return NextResponse.redirect(new URL('/', req.url), 302)
}
