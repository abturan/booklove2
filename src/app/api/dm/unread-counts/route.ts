// src/app/api/dm/unread-counts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const meId = session.user.id

  const threads = await prisma.dmThread.findMany({
    where: { OR: [{ userAId: meId }, { userBId: meId }] },
    select: { id: true }
  })
  const ids = threads.map(t => t.id)
  if (ids.length === 0) return NextResponse.json({ ok: true, items: {}, total: 0 })

  const reads = await prisma.dmThreadRead.findMany({
    where: { userId: meId, threadId: { in: ids } },
    select: { threadId: true, lastReadAt: true }
  })
  const readMap = new Map<string, Date>(reads.map(r => [r.threadId, r.lastReadAt]))

  const items: Record<string, number> = {}
  let total = 0
  for (const id of ids) {
    const lastReadAt = readMap.get(id) ?? new Date(0)
    const count = await prisma.dmMessage.count({
      where: { threadId: id, createdAt: { gt: lastReadAt }, NOT: { authorId: meId } }
    })
    if (count > 0) {
      items[id] = count
      total += count
    }
  }

  return NextResponse.json({ ok: true, items, total })
}
