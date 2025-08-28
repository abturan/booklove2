import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { published } = await req.json()
  await prisma.club.update({ where: { id: params.id }, data: { published: !!published } })
  return NextResponse.json({ ok: true })
}
