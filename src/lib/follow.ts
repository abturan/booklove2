'use server'

import { prisma } from '@/lib/prisma'

export type FollowRelation = 'self' | 'mutual' | 'following' | 'follower' | 'none'

export async function ensureFollow({
  followerId,
  followingId,
}: {
  followerId: string
  followingId: string
}) {
  if (followerId === followingId) {
    throw new Error('Cannot follow self')
  }

  try {
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      select: { id: true },
    })

    if (existing) {
      const mutual = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: followingId, followingId: followerId },
        },
        select: { id: true },
      })
      return { status: 'ALREADY', mutual: Boolean(mutual) as boolean }
    }

    await prisma.follow.create({
      data: { followerId, followingId },
    })

    const mutual = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: followingId, followingId: followerId },
      },
      select: { id: true },
    })

    return { status: 'FOLLOWING', mutual: Boolean(mutual) as boolean }
  } catch (err) {
    console.warn('[follow] ensureFollow failed', err)
    return { status: 'ERROR', mutual: false }
  }
}

export async function removeFollow({
  followerId,
  followingId,
}: {
  followerId: string
  followingId: string
}) {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  })
}

export async function getFollowRelation(viewerId: string | null, targetId: string): Promise<FollowRelation> {
  if (!viewerId) return 'none'
  if (viewerId === targetId) return 'self'

  try {
    const links = await prisma.follow.findMany({
      where: {
        OR: [
          { followerId: viewerId, followingId: targetId },
          { followerId: targetId, followingId: viewerId },
        ],
      },
      select: { followerId: true, followingId: true },
    })

    const viewerFollows = links.some((l) => l.followerId === viewerId && l.followingId === targetId)
    const targetFollows = links.some((l) => l.followerId === targetId && l.followingId === viewerId)

    if (viewerFollows && targetFollows) return 'mutual'
    if (viewerFollows) return 'following'
    if (targetFollows) return 'follower'
  } catch (err) {
    console.warn('[follow] getFollowRelation failed', err)
  }
  return 'none'
}

export async function listFollowData(userId: string) {
  try {
    const [followingRows, followerRows] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: { select: { id: true, name: true, username: true, slug: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const followerIdSet = new Set(followerRows.map((row) => row.follower.id))
    const followingIdSet = new Set(followingRows.map((row) => row.following.id))

    const following = followingRows.map((row) => ({
      ...row.following,
      relationship: followerIdSet.has(row.following.id) ? ('mutual' as FollowRelation) : ('following' as FollowRelation),
    }))

    const followers = followerRows.map((row) => ({
      ...row.follower,
      relationship: followingIdSet.has(row.follower.id) ? ('mutual' as FollowRelation) : ('follower' as FollowRelation),
    }))

    const mutual = following.filter((user) => user.relationship === 'mutual')

    return { following, followers, mutual }
  } catch (err) {
    console.warn('[follow] listFollowData failed', err)
    return { following: [], followers: [], mutual: [] }
  }
}

export async function getFollowCounts(userId: string) {
  try {
    const [following, followers] = await Promise.all([
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
    ])
    return { following, followers }
  } catch (err) {
    console.warn('[follow] getFollowCounts failed', err)
    return { following: 0, followers: 0 }
  }
}
