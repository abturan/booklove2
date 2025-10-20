// src/app/api/dm/mark-read/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { threadId } = await req.json().catch(() => ({}))
  if (!threadId) return NextResponse.json({ ok: false, error: 'threadId required' }, { status: 400 })

  await prisma.dmThreadRead.upsert({
    where: { threadId_userId: { threadId, userId: meId } },
    create: { threadId, userId: meId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() }
  })

  return NextResponse.json({ ok: true })
}
