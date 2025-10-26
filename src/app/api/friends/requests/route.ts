// src/app/api/friends/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const meId = session.user.id

  let targetId = ''
  let action = ''
  try {
    const body = await req.json()
    targetId = String(body?.userId || '').trim()
    action = String(body?.action || '').trim().toLowerCase()
  } catch {}

  if (!targetId) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (targetId === meId) {
    return NextResponse.json({ error: 'self_not_allowed' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } })
  if (!exists) {
    return NextResponse.json({ error: 'target_not_found' }, { status: 404 })
  }

  const now = new Date()

  // --- ACCEPT ---
  if (action === 'accept') {
    const pending = await prisma.friendRequest.findFirst({
      where: { fromId: targetId, toId: meId, status: 'PENDING' },
      select: { id: true },
    })
    if (!pending) return NextResponse.json({ status: 'NONE' })
    await prisma.friendRequest.update({
      where: { id: pending.id },
      data: { status: 'ACCEPTED', respondedAt: now },
    })
    return NextResponse.json({ status: 'ACCEPTED' })
  }

  // --- CANCEL ---
  if (action === 'cancel') {
    const mine = await prisma.friendRequest.findFirst({
      where: { fromId: meId, toId: targetId, status: 'PENDING' },
      select: { id: true },
    })
    if (!mine) return NextResponse.json({ status: 'NONE' })
    await prisma.friendRequest.delete({ where: { id: mine.id } })
    return NextResponse.json({ status: 'CANCELED' })
  }

  // --- SEND / UPSERT ---
  const accepted = await prisma.friendRequest.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { fromId: meId, toId: targetId },
        { fromId: targetId, toId: meId },
      ],
    },
    select: { id: true },
  })
  if (accepted) return NextResponse.json({ status: 'ACCEPTED' })

  const incoming = await prisma.friendRequest.findFirst({
    where: { fromId: targetId, toId: meId, status: 'PENDING' },
    select: { id: true },
  })
  if (incoming) {
    await prisma.friendRequest.update({
      where: { id: incoming.id },
      data: { status: 'ACCEPTED', respondedAt: now },
    })
    return NextResponse.json({ status: 'ACCEPTED' })
  }

  const mine = await prisma.friendRequest.findFirst({
    where: { fromId: meId, toId: targetId },
    select: { id: true, status: true },
  })
  if (mine?.status === 'PENDING') return NextResponse.json({ status: 'PENDING' })
  if (mine?.status === 'DECLINED') {
    await prisma.friendRequest.update({
      where: { id: mine.id },
      data: { status: 'PENDING', createdAt: now, respondedAt: null },
    })
    return NextResponse.json({ status: 'PENDING' })
  }

  await prisma.friendRequest.create({
    data: { fromId: meId, toId: targetId, status: 'PENDING' },
  })
  return NextResponse.json({ status: 'PENDING' })
}
