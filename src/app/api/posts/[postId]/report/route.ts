// src/app/api/posts/[postId]/report/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const meId = session.user.id
  const { postId } = params

  const payload = await req.json().catch(() => null)
  const reasons = Array.isArray(payload?.reasons) ? payload.reasons.filter((r: any) => typeof r === 'string' && r.trim()) : []
  if (reasons.length === 0) return NextResponse.json({ error: 'Sebep gerekli' }, { status: 400 })

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
  if (!post) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await prisma.postReport.createMany({
    data: reasons.slice(0, 5).map((reason: string) => ({ postId, userId: meId, reason: reason.trim() })),
  })

  return NextResponse.json({ ok: true })
}
