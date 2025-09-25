// src/app/api/friends/requests/[id]/accept/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const id = params.id

  const reqRow = await prisma.friendRequest.findUnique({ where: { id }, select: { toId: true, status: true } })
  if (!reqRow || reqRow.toId !== meId || reqRow.status !== 'PENDING') {
    return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  }

  await prisma.friendRequest.update({
    where: { id },
    data: { status: 'ACCEPTED', respondedAt: new Date() }
  })

  return NextResponse.json({ ok: true })
}
