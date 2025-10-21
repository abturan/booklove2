// src/components/club/club-interactive/types.ts
export type Initial = {
  me: {
    id: string | null
    name: string | null
    email: string | null
    avatarUrl: string | null
    city: string | null
    district: string | null
    phone: string | null
  }
  club: {
    id: string
    slug: string
    name: string
    description: string | null
    bannerUrl: string
    priceTRY: number
    moderatorName: string
    moderatorAvatarUrl?: string | null
    moderatorUsername?: string | null
    memberCount: number
    isMember: boolean
    memberSince: string | null
    chatRoomId: string | null
    currentPick: { title: string; author: string; translator: string | null; pages: number | null; isbn: string | null; coverUrl: string; note: string | null; monthKey: string } | null
    prevPick: { monthKey: string; title: string; author: string; coverUrl: string } | null
    nextPick: { monthKey: string; title: string; author: string; coverUrl: string } | null
    nextEvent: { title: string; startsAt: string } | null
    members: { id: string; name: string; username?: string | null; avatarUrl: string | null }[]
    capacity: number | null
    isSoldOut: boolean
  }
}

export type Pending = { merchant_oid: string; iframe_url: string; createdAt: number } | null
