// src/app/api/friends/pending-count/route.ts  ⟵ (YENİ: bekleyen davet sayısı)
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const n = await prisma.friendRequest.count({
    where: { toId: meId, status: 'PENDING' },
  })
  return NextResponse.json({ ok: true, count: n })
}
