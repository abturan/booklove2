import { prisma } from '@/lib/prisma'

let ensured = false

export async function ensureConferenceFlagColumn() {
  if (ensured) return
  ensured = true
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Club" ADD COLUMN IF NOT EXISTS "conferenceEnabled" BOOLEAN DEFAULT FALSE'
    )
  } catch (err) {
    console.warn('conferenceEnabled column check failed:', err)
  }
}
