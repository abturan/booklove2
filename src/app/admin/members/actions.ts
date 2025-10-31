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
  const requestedEventId = String(formData.get('clubEventId') || '')
  if (!userId || !requestedEventId) throw new Error('Eksik bilgi')

  const event = await prisma.clubEvent.findUnique({
    where: { id: requestedEventId },
    select: { id: true, clubId: true, priceTRY: true, capacity: true },
  })

  if (!event) throw new Error('Etkinlik bulunamadı')

  const clubId = event.clubId
  const clubEventId = event.id

  // Kulüp kapasitesi (etkinlik öncelikli)
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, capacity: true },
  })
  if (!club) throw new Error('Kulüp bulunamadı')

  const effectiveCapacity =
    typeof event.capacity === 'number' && event.capacity >= 0
      ? event.capacity
      : typeof club.capacity === 'number' && club.capacity >= 0
        ? club.capacity
        : null

  if (typeof effectiveCapacity === 'number') {
    const activeCount = await prisma.membership.count({
      where: { clubEventId, isActive: true },
    })
    if (activeCount >= effectiveCapacity) {
      throw new Error('Etkinlik kapasitesi dolu')
    }
  }

  // Membership upsert (idempotent)
  await prisma.membership.upsert({
    where: { userId_clubEventId: { userId, clubEventId } },
    update: { isActive: true, role: 'MEMBER', clubId },
    create: { userId, clubId, clubEventId, isActive: true, role: 'MEMBER' },
  })

  // Subscription upsert (manuel abonelik etkinleştirme)
  await prisma.subscription.upsert({
    where: { userId_clubEventId: { userId, clubEventId } },
    update: { active: true, startedAt: new Date(), canceledAt: null, clubId },
    create: { userId, clubId, clubEventId, active: true, startedAt: new Date() },
  })

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/admin/members')
}
