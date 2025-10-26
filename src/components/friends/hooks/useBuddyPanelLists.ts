// src/components/friends/hooks/useBuddyPanelLists.ts
'use client'

import { useEffect, useRef, useState } from 'react'

type UserLite = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
}

type BuddySets = {
  friends: Set<string>
  incoming: Set<string>
  outgoing: Set<string>
}

export function useBuddyPanelLists(enabled: boolean) {
  const [friends, setFriends] = useState<UserLite[]>([])
  const [incoming, setIncoming] = useState<UserLite[]>([])
  const [outgoing, setOutgoing] = useState<UserLite[]>([])
  const [sets, setSets] = useState<BuddySets>({ friends: new Set(), incoming: new Set(), outgoing: new Set() })
  const loaded = useRef(false)

  const toLite = (u: any): UserLite => ({
    id: String(u.id),
    name: u.name ?? null,
    username: u.username ?? null,
    slug: u.slug ?? null,
    avatarUrl: u.avatarUrl ?? null,
  })

  async function reload() {
    try {
      const r = await fetch('/api/friends/panel', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error('panel')

      const f: UserLite[] = Array.isArray(j.friends) ? (j.friends as any[]).map(toLite) : []
      const o: UserLite[] = (Array.isArray(j.outgoing) ? (j.outgoing as any[]) : []).map((x: any) => toLite(x.to || x))
      const i: UserLite[] = (Array.isArray(j.incoming) ? (j.incoming as any[]) : []).map((x: any) => toLite(x.from || x))

      setFriends(f)
      setOutgoing(o)
      setIncoming(i)
      setSets({
        friends: new Set(f.map((x: UserLite) => x.id)),
        outgoing: new Set(o.map((x: UserLite) => x.id)),
        incoming: new Set(i.map((x: UserLite) => x.id)),
      })
    } catch {
      setFriends([])
      setOutgoing([])
      setIncoming([])
      setSets({ friends: new Set(), incoming: new Set(), outgoing: new Set() })
    }
  }

  useEffect(() => {
    if (!enabled || loaded.current) return
    reload().finally(() => {
      loaded.current = true
    })
  }, [enabled])

  async function addFriend(userId: string) {
    if (!userId) return
    try {
      const r = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!r.ok) throw new Error('add')
      await reload()
    } catch {}
  }

  async function acceptIncoming(userId: string) {
    if (!userId) return
    try {
      const r = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'accept' }),
      })
      if (!r.ok) throw new Error('accept')
      await reload()
    } catch {}
  }

  async function cancelOutgoing(userId: string) {
    if (!userId) return
    try {
      const r = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, action: 'cancel' }),
      })
      if (!r.ok) throw new Error('cancel')
      await reload()
    } catch {}
  }

  return { friends, incoming, outgoing, sets, addFriend, acceptIncoming, cancelOutgoing }
}






