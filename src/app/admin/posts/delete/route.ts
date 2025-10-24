// src/app/admin/posts/delete/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.redirect(new URL('/', req.url))

  const form = await req.formData()
  const id = String(form.get('id') || '')
  await prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany({ where: { postId: id } })
    await tx.like.deleteMany({ where: { postId: id } })
    await tx.postImage.deleteMany({ where: { postId: id } })
    await tx.post.delete({ where: { id } })
  })
  const back = new URL(req.url)
  back.pathname = '/admin/posts'
  return NextResponse.redirect(back)
}
