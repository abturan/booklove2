// src/app/api/friends/respond/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const meId = session.user.id
  const { requestId, action } = await req.json().catch(() => ({} as any))
  if (!requestId || !['ACCEPT', 'DECLINE', 'CANCEL'].includes(action)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } })
  if (!fr) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (action === 'ACCEPT') {
    if (fr.toId !== meId || fr.status !== 'PENDING') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    await prisma.friendRequest.update({
      where: { id: fr.id },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'DECLINE') {
    if (fr.toId !== meId || fr.status !== 'PENDING') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    await prisma.friendRequest.update({
      where: { id: fr.id },
      data: { status: 'DECLINED', respondedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  // CANCEL (gönderen iptal eder)
  if (action === 'CANCEL') {
    if (fr.fromId !== meId || fr.status !== 'PENDING') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    await prisma.friendRequest.update({
      where: { id: fr.id },
      data: { status: 'DECLINED', respondedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown' }, { status: 400 })
}
