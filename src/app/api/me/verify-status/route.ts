// src/app/api/me/verify-status/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isEmailVerifiedOrLegacy } from '@/lib/guards'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, authenticated: false })
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
  const verified = await isEmailVerifiedOrLegacy(session.user.id)
  return NextResponse.json({ ok: true, authenticated: true, verified, email: me?.email || null })
}
