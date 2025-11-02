// src/app/api/auth/verify-email/resend/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderEmail } from '@/lib/emailTemplates'
import { sendMail } from '@/lib/mail'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, name: true, username: true, emailVerifiedAt: true } })
  if (!me?.email) return NextResponse.json({ error: 'Email yok' }, { status: 400 })
  if (me.emailVerifiedAt) return NextResponse.json({ ok: true, already: true })

  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48)
  await (prisma as any).emailVerificationToken.create({ data: { userId: me.id, email: me.email, token, expiresAt } })

  const verifyUrl = new URL('/api/auth/verify-email', req.url)
  verifyUrl.searchParams.set('token', token)
  const greet = me.username ? `@${me.username}` : (me.name || me.email)
  const html = renderEmail({
    title: 'Boook.love — E‑posta doğrulaması',
    bodyHtml: `<p>Merhaba <b>${greet}</b>,<br/>Hesabını etkinleştirmek için e‑posta adresini doğrulamalısın.</p>`,
    ctaLabel: 'E‑postamı doğrula',
    ctaUrl: verifyUrl.toString(),
  })
  await sendMail(me.email, 'Boook.love — E‑posta doğrulaması', html)
  return NextResponse.json({ ok: true })
}

