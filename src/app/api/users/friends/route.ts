import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listFollowData } from '@/lib/follow'

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

    const { followers, following, mutual } = await listFollowData(targetId)

    const allUsers = [...followers, ...following]
    const relationMap = new Map<string, 'self' | 'mutual' | 'following' | 'follower' | 'none'>()

    if (meId) {
      const ids = Array.from(new Set(allUsers.map((u) => u.id))).filter((id) => id !== meId)
      if (ids.length > 0) {
        const relations = await prisma.follow.findMany({
          where: {
            OR: [
              { followerId: meId, followingId: { in: ids } },
              { followerId: { in: ids }, followingId: meId },
            ],
          },
          select: { followerId: true, followingId: true },
        })
        for (const id of ids) {
          const viewerFollows = relations.some((r) => r.followerId === meId && r.followingId === id)
          const targetFollows = relations.some((r) => r.followerId === id && r.followingId === meId)
          let status: 'self' | 'mutual' | 'following' | 'follower' | 'none' = 'none'
          if (viewerFollows && targetFollows) status = 'mutual'
          else if (viewerFollows) status = 'following'
          else if (targetFollows) status = 'follower'
          relationMap.set(id, status)
        }
      }
    }

    const mapUser = (user: typeof mutual[number]) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      slug: user.slug,
      avatarUrl: user.avatarUrl,
      relationship: user.id === meId ? 'self' : relationMap.get(user.id) ?? 'none',
    })

    return NextResponse.json({
      items: mutual.map(mapUser),
      followers: followers.map(mapUser),
      following: following.map(mapUser),
    })
  } catch (error: any) {
    console.error('[friends:list] error', error)
    return NextResponse.json({ error: 'Arkadaş listesi alınamadı.' }, { status: 500 })
  }
}
