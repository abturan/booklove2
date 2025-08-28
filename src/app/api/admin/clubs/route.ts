import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const name: string = (body.name || '').trim()
  const description: string = body.description || ''
  const priceTRY: number = Number(body.priceTRY || 0)
  const bannerUrl: string = body.bannerUrl || ''
  const moderatorId: string | undefined = body.moderatorId
  if (!name) return NextResponse.json('Kulüp adı zorunlu', { status: 400 })
  if (!moderatorId) return NextResponse.json('Moderatör seçin', { status: 400 })

  const created = await prisma.club.create({
    data: {
      name,
      slug: slugify(name),
      description,
      priceTRY,
      bannerUrl,
      moderatorId,
      published: false,
    },
    select: { id: true, slug: true },
  })
  return NextResponse.json(created)
}
