// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { renderEmail } from '@/lib/emailTemplates'
import { sendMail } from '@/lib/mail'
import crypto from 'crypto'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { alertUserRegistered, alertError } from '@/lib/adminAlert'

export async function POST(req: Request) {
  try {
    const { name, email, password, username, captchaToken } = await req.json()

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof username !== 'string' ||
      !email.includes('@') ||
      password.length < 6
    ) {
      return NextResponse.json(
        { ok: false, message: 'Geçersiz alanlar.' },
        { status: 400 }
      )
    }

    const uname = username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
      return NextResponse.json(
        { ok: false, message: 'Geçersiz kullanıcı adı.' },
        { status: 400 }
      )
    }

    // recaptcha (opsiyonel; env yoksa geç)
    const okCaptcha = await verifyRecaptcha(captchaToken)
    if (!okCaptcha) {
      return NextResponse.json({ ok: false, message: 'Güvenlik doğrulaması başarısız.' }, { status: 400 })
    }

    const emailExists = await prisma.user.findUnique({ where: { email } })
    if (emailExists) {
      return NextResponse.json(
        { ok: false, message: 'Bu e-posta zaten kayıtlı.' },
        { status: 409 }
      )
    }

    const usernameExists = await prisma.user.findFirst({
      where: { username: { equals: uname, mode: 'insensitive' } },
      select: { id: true },
    })
    if (usernameExists) {
      return NextResponse.json(
        { ok: false, message: 'Bu kullanıcı adı alınmış.' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
        username: uname,
      },
      select: { id: true, name: true, email: true }
    })

    // create email verification token (valid 48h) and send email with link
    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48)
    await (prisma as any).emailVerificationToken.create({ data: { userId: user.id, email: user.email, token, expiresAt } })

    const verifyUrl = new URL('/api/auth/verify-email', req.url)
    verifyUrl.searchParams.set('token', token)
    const greet = uname ? `@${uname}` : (name || email)
    const html = renderEmail({
      title: 'Boook.love — E‑posta doğrulaması',
      bodyHtml: `<p>Merhaba <b>${greet}</b>,
                 <br/>Boook.love'a hoş geldin! Hesabını etkinleştirmek için e‑posta adresini doğrulamalısın.</p>`,
      ctaLabel: 'E‑postamı doğrula',
      ctaUrl: verifyUrl.toString(),
    })
    await sendMail(user.email, 'Boook.love — E‑posta doğrulaması', html)
    alertUserRegistered({ id: user.id, name: user.name, email: user.email, username: uname }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    alertError('register', e as any).catch(() => {})
    return NextResponse.json(
      { ok: false, message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
