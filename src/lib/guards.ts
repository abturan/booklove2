// src/lib/guards.ts
import { prisma } from '@/lib/prisma'

function parseCutoff(): Date | null {
  const v = process.env.EMAIL_VERIFY_CUTOFF
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function isEmailVerifiedOrLegacy(userId: string): Promise<boolean> {
  const cutoff = parseCutoff()
  // If cutoff not defined, treat legacy as verified to avoid breaking old users
  if (!cutoff) {
    const row = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } })
    return !!row?.emailVerifiedAt || true
  }
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true, createdAt: true } })
  if (!row) return false
  if (row.emailVerifiedAt) return true
  return row.createdAt < cutoff
}

