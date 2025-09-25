// src/app/api/friends/respond/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  let body: any = null
  try { body = await req.json() } catch {}
  const requestId = body?.requestId as string | undefined
  const action = body?.action as 'ACCEPT' | 'DECLINE' | 'IGNORE' | undefined
  if (!requestId || !['ACCEPT', 'DECLINE', 'IGNORE'].includes(action as any)) {
    return NextResponse.json({ ok: false, error: 'Geçersiz istek' }, { status: 400 })
  }

  const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } })
  if (!fr || fr.toId !== meId) return NextResponse.json({ ok: false, error: 'Bulunamadı' }, { status: 404 })

  if (action === 'IGNORE') {
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { respondedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'ACCEPT') {
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { respondedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
