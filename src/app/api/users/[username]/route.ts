// src/app/api/users/[username]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: { username: string } }

export async function GET(_req: Request, { params }: Params) {
  const username = params.username.toLowerCase()

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      about: true,
      website: true,
      location: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  return NextResponse.json({ ok: true, user })
}
