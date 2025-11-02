// src/app/api/dm/message/[messageId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { messageId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const me = session.user.id
  const { messageId } = params
  const row = await prisma.dmMessage.findUnique({ where: { id: messageId }, select: { authorId: true } })
  if (!row) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  if (row.authorId !== me) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  const body = await req.json().catch(() => null)
  const text = typeof body?.body === 'string' ? body.body.trim() : ''
  if (!text) return NextResponse.json({ ok: false, error: 'empty' }, { status: 400 })
  await prisma.dmMessage.update({ where: { id: messageId }, data: { body: text } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { messageId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const me = session.user.id
  const { messageId } = params
  const row = await prisma.dmMessage.findUnique({ where: { id: messageId }, select: { authorId: true } })
  if (!row) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  if (row.authorId !== me) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  await prisma.dmMessage.delete({ where: { id: messageId } })
  return NextResponse.json({ ok: true })
}

