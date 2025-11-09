// src/app/api/auth/email-code/send/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderEmail } from '@/lib/emailTemplates'
import { sendMail } from '@/lib/mail'

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ ok: false, message: 'Geçerli e‑posta girin.' }, { status: 400 })
  }
  const now = new Date()
  // rate-limit: 60s
  const recent = await (prisma as any).emailVerificationToken.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } })
  if (recent && now.getTime() - recent.createdAt.getTime() < 60_000) {
    return NextResponse.json({ ok: false, message: 'Kod zaten gönderildi. Lütfen biraz bekleyin.' }, { status: 429 })
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(now.getTime() + 20 * 60_000)
  await (prisma as any).emailVerificationToken.create({ data: { email, token: code, expiresAt } })

  const html = renderEmail({
    title: 'Book.love — E‑posta doğrulama kodu',
    bodyHtml: `<p>Merhaba,</p><p>E‑posta doğrulama kodun: <b style="font-size:18px;letter-spacing:2px;">${code}</b></p><p>Bu kod 20 dakika boyunca geçerlidir.</p>`,
  })
  await sendMail(email, 'Book.love — E‑posta doğrulama kodu', html)
  return NextResponse.json({ ok: true })
}

