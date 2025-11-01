// src/components/profile/fb/data.ts
import { prisma } from '../../../lib/prisma'
import { listFollowData } from '@/lib/follow'

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

  const { mutual } = await listFollowData(user.id)
  const top15 = mutual.slice(0, 15)

  return {
    ...user,
    friendsCount: mutual.length,
    friendsPreview: top15, // [{id,name,avatarUrl}]
  }
}
