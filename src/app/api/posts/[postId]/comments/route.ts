// src/app/api/posts/[postId]/comments/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { postId: string } }) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50)
  const postId = params.postId

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true, body: true, createdAt: true,
      user: { select: { id: true, name: true, username: true, avatarUrl: true } }
    }
  })
  return NextResponse.json({ items: comments })
}

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const postId = params.postId

  const payload = await req.json().catch(() => null)
  if (!payload || typeof payload.body !== 'string' || !payload.body.trim()) {
    return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
  }

  await prisma.comment.create({
    data: { postId, userId: meId, body: payload.body.trim() }
  })

  return NextResponse.json({ ok: true })
}
