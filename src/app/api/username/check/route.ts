// src/app/api/username/check/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const username = String(searchParams.get('username') || '').trim().toLowerCase()
  if (!username) {
    return NextResponse.json({ ok: false, message: 'username gerekli' }, { status: 400 })
  }
  const valid = /^[a-z0-9_]{3,20}$/.test(username)
  if (!valid) {
    return NextResponse.json({ ok: true, available: false })
  }
  const existing = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
    select: { id: true },
  })
  return NextResponse.json({ ok: true, available: !existing })
}






