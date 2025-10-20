// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { name, email, password, username } = await req.json()

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
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
        username: uname,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
