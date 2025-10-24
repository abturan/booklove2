// src/app/admin/posts/moderate/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.redirect(new URL('/', req.url))

  const form = await req.formData()
  const id = String(form.get('id') || '')
  const action = String(form.get('action') || '').toLowerCase()

  let status: 'PUBLISHED' | 'PENDING' | 'HIDDEN'
  if (action === 'publish') status = 'PUBLISHED'
  else if (action === 'pending') status = 'PENDING'
  else status = 'HIDDEN'

  await prisma.post.update({ where: { id }, data: { status } })
  const back = new URL(req.url)
  back.pathname = '/admin/posts'
  return NextResponse.redirect(back)
}
