// src/components/profile/fb/data.ts
import { prisma } from '../../../lib/prisma'

// slug->ad karşılaştırması için
const norm = (s: string) => s.replace(/-/g, ' ').trim()

export async function findUserByHandle(handle: string) {
  // 1) Kullanıcıyı getir (sade alanlar)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: handle },
        { name: { equals: norm(handle), mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
    },
  })

  if (!user) return null

  // 2) Arkadaşlıkları FriendRequest tablosundan hesapla
  // ACCEPTED olan ve bu kullanıcıyı içeren kayıtlar
  const requests = await prisma.friendRequest.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ fromId: user.id }, { toId: user.id }],
    },
    select: {
      fromId: true,
      toId: true,
      from: { select: { id: true, name: true, avatarUrl: true } },
      to: { select: { id: true, name: true, avatarUrl: true } },
    },
    take: 60, // küçük bir üst sınır; aşağıda zaten 15'e düşürüyoruz
    orderBy: { createdAt: 'desc' },
  })

  const peers = []
  for (const r of requests) {
    const peer = r.fromId === user.id ? r.to : r.from
    if (peer) peers.push(peer)
  }

  // benzersiz ilk 15
  const seen = new Set<string>()
  const top15 = []
  for (const p of peers) {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      top15.push(p)
    }
    if (top15.length >= 15) break
  }

  return {
    ...user,
    friendsCount: requests.length,
    friendsPreview: top15, // [{id,name,avatarUrl}]
  }
}
