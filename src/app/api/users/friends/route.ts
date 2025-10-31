import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const session = await auth()
    const meId = session?.user?.id || null

    const { searchParams } = new URL(req.url)
    const targetId = searchParams.get('userId')
    if (!targetId) {
      return NextResponse.json({ error: 'userId parametresi gerekli' }, { status: 400 })
    }

    const accepted = await prisma.friendRequest.findMany({
      where: { status: 'ACCEPTED', OR: [{ fromId: targetId }, { toId: targetId }] },
      include: {
        from: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
        to: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
      },
      orderBy: { respondedAt: 'desc' },
    })

    const friendMap = new Map<string, { id: string; name: string | null; username: string | null; slug: string | null; avatarUrl: string | null }>()
    for (const r of accepted) {
      const other = r.fromId === targetId ? r.to : r.from
      if (other) friendMap.set(other.id, other)
    }
    const friends = Array.from(friendMap.values())

    const relationships: Record<string, 'self' | 'friend' | 'outgoing' | 'incoming' | 'none'> = {}

    if (meId) {
      const ids = friends.filter((f) => f.id !== meId).map((f) => f.id)
      if (ids.length > 0) {
        const relations = await prisma.friendRequest.findMany({
          where: {
            OR: [
              { fromId: meId, toId: { in: ids } },
              { fromId: { in: ids }, toId: meId },
            ],
          },
          select: { fromId: true, toId: true, status: true, respondedAt: true },
          orderBy: { createdAt: 'desc' },
        })
        const grouped = new Map<string, typeof relations>()
        for (const rel of relations) {
          const other = rel.fromId === meId ? rel.toId : rel.fromId
          if (!grouped.has(other)) grouped.set(other, [])
          grouped.get(other)!.push(rel)
        }
        for (const id of ids) {
          const rels = grouped.get(id) || []
          let mode: 'friend' | 'outgoing' | 'incoming' | 'none' = 'none'
          if (rels.some((r) => r.status === 'ACCEPTED')) mode = 'friend'
          else {
            const mine = rels.find((r) => r.fromId === meId && r.toId === id)
            const theirs = rels.find((r) => r.toId === meId && r.fromId === id)
            if (mine?.status === 'PENDING') mode = 'outgoing'
            else if (theirs?.status === 'PENDING' && !theirs.respondedAt) mode = 'incoming'
          }
          relationships[id] = mode
        }
      }
    }

    const items = friends.map((f) => ({
      id: f.id,
      name: f.name,
      username: f.username,
      slug: f.slug,
      avatarUrl: f.avatarUrl,
      relationship: f.id === meId ? 'self' : relationships[f.id] ?? 'none',
    }))

    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('[friends:list] error', error)
    return NextResponse.json({ error: 'Arkadaş listesi alınamadı.' }, { status: 500 })
  }
}
