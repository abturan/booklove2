// scripts/mark-legacy-verified.ts
import { prisma } from '../src/lib/prisma'

async function main() {
  const arg = process.argv[2] || process.env.EMAIL_VERIFY_CUTOFF
  if (!arg) {
    console.error('Usage: tsx scripts/mark-legacy-verified.ts 2025-01-01T00:00:00Z')
    process.exit(1)
  }
  const cutoff = new Date(arg)
  if (Number.isNaN(cutoff.getTime())) {
    console.error('Invalid cutoff date:', arg)
    process.exit(1)
  }
  const res = await prisma.user.updateMany({
    where: { emailVerifiedAt: null, createdAt: { lt: cutoff } },
    data: { emailVerifiedAt: new Date() },
  })
  console.log(`Marked ${res.count} legacy users as verified (cutoff=${cutoff.toISOString()})`)
}

main().finally(() => prisma.$disconnect())

