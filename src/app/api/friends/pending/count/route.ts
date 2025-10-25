// src/app/api/friends/pending/count/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
  const meId = session.user.id
  const count = await prisma.friendRequest.count({
    where: { toId: meId, status: 'PENDING' },
  })
  return NextResponse.json({ count })
}
