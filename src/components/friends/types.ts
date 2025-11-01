// src/components/friends/types.ts
export type UserLite = {
  id: string
  name: string | null
  username: string | null
  slug: string | null
  avatarUrl: string | null
  relationship?: 'self' | 'mutual' | 'following' | 'follower' | 'none'
}

export type BuddySets = {
  mutual: Set<string>
  following: Set<string>
  followers: Set<string>
}
