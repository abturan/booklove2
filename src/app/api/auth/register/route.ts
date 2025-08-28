import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.includes('@') ||
      password.length < 6
    ) {
      return NextResponse.json(
        { ok: false, message: 'Geçersiz form verisi' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { ok: false, message: 'Bu e-posta zaten kayıtlı' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'USER',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { ok: false, message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
