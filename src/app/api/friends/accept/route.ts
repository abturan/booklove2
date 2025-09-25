// src/app/api/friends/accept/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id

  const { requestId } = await req.json().catch(() => ({}))
  if (!requestId) return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })

  const fr = await prisma.friendRequest.findUnique({ where: { id: requestId } })
  if (!fr || fr.toId !== meId) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (fr.status === 'ACCEPTED') return NextResponse.json({ ok: true, already: true })

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED', respondedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
