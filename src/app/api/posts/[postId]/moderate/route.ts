// src/app/api/posts/[postId]/moderate/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const action = String(body?.action || '').toLowerCase()

  let status: 'PUBLISHED' | 'PENDING' | 'HIDDEN'
  if (action === 'publish') status = 'PUBLISHED'
  else if (action === 'hide') status = 'HIDDEN'
  else if (action === 'pending') status = 'PENDING'
  else return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })

  const updated = await prisma.post.update({
    where: { id: params.postId },
    data: { status },
    select: {
      id: true,
      body: true,
      createdAt: true,
      status: true,
      owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      images: { select: { url: true, width: true, height: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  return NextResponse.json({ ok: true, post: updated })
}
