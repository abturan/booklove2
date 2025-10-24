// src/app/admin/members/actions.ts
'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function assignMemberToClub(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error('Yetkisiz işlem')
  }

  const userId = String(formData.get('userId') || '')
  const clubId = String(formData.get('clubId') || '')
  if (!userId || !clubId) throw new Error('Eksik bilgi')

  // Kulüp ve kapasite kontrolü (varsa)
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, capacity: true },
  })
  if (!club) throw new Error('Kulüp bulunamadı')

  if (club.capacity != null) {
    const activeCount = await prisma.membership.count({
      where: { clubId, isActive: true },
    })
    if (activeCount >= club.capacity) {
      throw new Error('Kulüp kapasitesi dolu')
    }
  }

  // Membership upsert (idempotent)
  await prisma.membership.upsert({
    where: { userId_clubId: { userId, clubId } },
    update: { isActive: true, role: 'MEMBER' },
    create: { userId, clubId, isActive: true, role: 'MEMBER' },
  })

  // Subscription upsert (manuel abonelik etkinleştirme)
  await prisma.subscription.upsert({
    where: { userId_clubId: { userId, clubId } },
    update: { active: true, startedAt: new Date(), canceledAt: null },
    create: { userId, clubId, active: true, startedAt: new Date() },
  })

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
}
