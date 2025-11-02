// src/app/api/comments/[commentId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { commentId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { commentId } = params
  const body = await req.json().catch(() => null)
  const text = typeof body?.body === 'string' ? body.body.trim() : ''
  if (!text) return NextResponse.json({ error: 'Boş içerik' }, { status: 400 })
  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } })
  if (!c) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  const isAdmin = (session.user as any)?.role === 'ADMIN'
  if (c.userId !== meId && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.comment.update({ where: { id: commentId }, data: { body: text } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { commentId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { commentId } = params
  const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } })
  if (!c) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  const isAdmin = (session.user as any)?.role === 'ADMIN'
  if (c.userId !== meId && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.comment.delete({ where: { id: commentId } })
  return NextResponse.json({ ok: true })
}

