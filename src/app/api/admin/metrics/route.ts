// src/app/api/admin/metrics/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PAID_STATUSES = [
  'PAID', 'SUCCESS', 'SUCCEEDED', 'COMPLETED', 'CAPTURED', 'SETTLED'
] as const

export async function GET() {
  // Toplam üye
  const totalUsers = await prisma.user.count()

  // Aktif kulüp: published = true
  const activeClubs = await prisma.club.count({ where: { published: true } })
  const totalClubs  = await prisma.club.count()

  // Ücretli abone (aktif)
  const paidSubscribers = await prisma.subscription.count({ where: { active: true } })

  // Ciro: PaymentIntent.amountTRY alanı kuruş biriminde toplanıyor (Int).
  // Yalnızca başarılı durumlar.
  const revenueAgg = await prisma.paymentIntent.aggregate({
    _sum: { amountTRY: true },
    where: { status: { in: [...PAID_STATUSES] } }
  })
  const sumKurus = revenueAgg._sum.amountTRY ?? 0
  const sumTry   = sumKurus / 100 // kuruş -> TL

  return NextResponse.json({
    users: { total: totalUsers },
    clubs: { active: activeClubs, total: totalClubs },
    subscribers: { paid: paidSubscribers },
    revenue: { totalKurus: sumKurus, totalTRY: sumTry }
  })
}
