// src/app/api/dm/peers/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { listFollowData } from '@/lib/follow'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'UNAUTHORIZED' }, { status: 401 })
  }
  const meId = session.user.id
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').toLowerCase().trim()

  const { followers, following } = await listFollowData(meId)
  const followerSet = new Set(followers.map((u) => u.id))

  let items = following
    .filter((u) => followerSet.has(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatarUrl: u.avatarUrl,
    }))

  if (q) {
    items = items.filter(p => (p.name || '').toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q))
  }
  items = items.slice(0, 50)

  return NextResponse.json({ ok: true, items })
}
