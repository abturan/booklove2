// src/components/friends/types.ts
export type UserLite = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
}

export type BuddySets = {
  friends: Set<string>
  incoming: Set<string>
  outgoing: Set<string>
}
