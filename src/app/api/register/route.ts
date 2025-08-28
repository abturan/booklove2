import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const form = await req.formData()
  const name = String(form.get('name') || '').trim()
  const email = String(form.get('email') || '').toLowerCase().trim()
  const password = String(form.get('password') || '')

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: 'Bu e-posta ile hesap var' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, passwordHash, role: 'USER' },
  })

  return NextResponse.json({ ok: true })
}
