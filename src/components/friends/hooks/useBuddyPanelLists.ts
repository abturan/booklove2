// src/components/friends/hooks/useBuddyPanelLists.ts
'use client'

import { useEffect, useRef, useState } from 'react'

type UserLite = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
  relationship?: 'self' | 'mutual' | 'following' | 'follower' | 'none'
}

export function useBuddyPanelLists(enabled: boolean) {
  const [mutual, setMutual] = useState<UserLite[]>([])
  const [following, setFollowing] = useState<UserLite[]>([])
  const [followers, setFollowers] = useState<UserLite[]>([])
  const [sets, setSets] = useState({
    mutual: new Set<string>(),
    following: new Set<string>(),
    followers: new Set<string>(),
  })
  const loaded = useRef(false)

  const toLite = (u: any): UserLite => ({
    id: String(u.id),
    name: u.name ?? null,
    username: u.username ?? null,
    slug: u.slug ?? null,
    avatarUrl: u.avatarUrl ?? null,
    relationship: typeof u.relationship === 'string' ? u.relationship : undefined,
  })

  async function reload() {
    try {
      const r = await fetch('/api/friends/panel', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error('panel')

      const mutualList: UserLite[] = Array.isArray(j.mutual) ? (j.mutual as any[]).map(toLite) : []
      const followingList: UserLite[] = Array.isArray(j.following) ? (j.following as any[]).map(toLite) : []
      const followersList: UserLite[] = Array.isArray(j.followers) ? (j.followers as any[]).map(toLite) : []

      setMutual(mutualList)
      setFollowing(followingList)
      setFollowers(followersList)
      setSets({
        mutual: new Set(mutualList.map((x) => x.id)),
        following: new Set(followingList.map((x) => x.id)),
        followers: new Set(followersList.map((x) => x.id)),
      })
    } catch {
      setMutual([])
      setFollowing([])
      setFollowers([])
      setSets({ mutual: new Set(), following: new Set(), followers: new Set() })
    }
  }

  useEffect(() => {
    if (!enabled || loaded.current) return
    reload().finally(() => {
      loaded.current = true
    })
  }, [enabled])

  async function followUser(userId: string) {
    if (!userId) return
    try {
      const r = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!r.ok) throw new Error('follow')
      await reload()
      window.dispatchEvent(new CustomEvent('friends:changed'))
    } catch {}
  }

  async function followBack(userId: string) {
    if (!userId) return
    try {
      const r = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'accept' }),
      })
      if (!r.ok) throw new Error('follow_back')
      await reload()
      window.dispatchEvent(new CustomEvent('friends:changed'))
    } catch {}
  }

  async function unfollowUser(userId: string) {
    if (!userId) return
    try {
      const r = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'unfollow' }),
      })
      if (!r.ok) throw new Error('unfollow')
      await reload()
      window.dispatchEvent(new CustomEvent('friends:changed'))
    } catch {}
  }

  return {
    mutual,
    following,
    followers,
    sets,
    followUser,
    followBack,
    unfollowUser,
    reload,
  }
}


