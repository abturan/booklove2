// src/app/api/friends/pending-count/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    const meId = session?.user?.id
    if (!meId) return NextResponse.json({ total: 0 })

    const total = await prisma.dmThread.count({
      where: {
        status: 'REQUESTED',
        requestedById: { not: meId },
        OR: [{ userAId: meId }, { userBId: meId }],
      },
    })

    return NextResponse.json({ total })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ total: 0 }, { status: 500 })
  }
}
