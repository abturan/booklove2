// src/app/api/posts/[postId]/likes/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(_req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { postId } = params

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: meId } }
  }).catch(() => null)

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    return NextResponse.json({ ok: true, liked: false })
  }

  await prisma.like.create({ data: { postId, userId: meId } })
  return NextResponse.json({ ok: true, liked: true })
}
