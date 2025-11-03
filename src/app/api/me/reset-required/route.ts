import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ required: false })
  const userId = session.user.id
  const count = await prisma.passwordResetToken.count({ where: { userId, usedAt: null, expiresAt: { gt: new Date() } } })
  return NextResponse.json({ required: count > 0 })
}

