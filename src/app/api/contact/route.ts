// src/app/api/contact/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'Geçersiz istek' }, { status: 400 })
    }
    const { name, email, message, website } = body as Record<string, string>
    if (website) return NextResponse.json({ ok: true, skipped: true }) // honeypot
    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }
    // Burada gerçek e-posta/CRM entegrasyonu eklenebilir.
    console.log('[CONTACT]', { name, email, message })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Sunucu hatası' }, { status: 500 })
  }
}
