// src/app/api/posts/[postId]/rebooks/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { postId: string } }) {
  const { postId } = params

  const items = await prisma.post.findMany({
    where: { repostOfId: postId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      body: true,
      createdAt: true,
      owner: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
    },
  })

  return NextResponse.json({ items })
}
