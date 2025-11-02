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

export async function adminUpdateUser(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error('Yetkisiz işlem')
  }
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Kullanıcı ID gerekli')
  const data: any = {}
  const get = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : null
  }
  const truthy = (k: string) => formData.get(k) === 'on' || formData.get(k) === 'true'

  const name = get('name'); if (name !== null) data.name = name || null
  const username = get('username'); if (username !== null) data.username = username || null
  const email = get('email'); if (email !== null) data.email = email || null
  const city = get('city'); if (city !== null) data.city = city || null
  const district = get('district'); if (district !== null) data.district = district || null
  const phone = get('phone'); if (phone !== null) data.phone = phone || null
  if (formData.has('emailVerified')) data.emailVerifiedAt = truthy('emailVerified') ? new Date() : null
  if (formData.has('phoneVerified')) data.phoneVerifiedAt = truthy('phoneVerified') ? new Date() : null

  await prisma.user.update({ where: { id }, data })
  revalidatePath(`/admin/members/${id}`)
  revalidatePath('/admin/members')
}

export async function deactivateMembership(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') throw new Error('Yetkisiz işlem')
  const membershipId = String(formData.get('membershipId') || '')
  const userId = String(formData.get('userId') || '')
  if (!membershipId) throw new Error('Üyelik ID gerekli')
  await prisma.membership.update({ where: { id: membershipId }, data: { isActive: false } })
  revalidatePath(`/admin/members/${userId}`)
}

export async function removeFromClub(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') throw new Error('Yetkisiz işlem')
  const userId = String(formData.get('userId') || '')
  const clubId = String(formData.get('clubId') || '')
  if (!userId || !clubId) throw new Error('Eksik bilgi')
  await prisma.membership.updateMany({ where: { userId, clubId }, data: { isActive: false } })
  await prisma.subscription.updateMany({ where: { userId, clubId, active: true }, data: { active: false, canceledAt: new Date() } })
  revalidatePath(`/admin/members/${userId}`)
}

export async function cancelSubscriptionAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') throw new Error('Yetkisiz işlem')
  const subscriptionId = String(formData.get('subscriptionId') || '')
  const userId = String(formData.get('userId') || '')
  if (!subscriptionId) throw new Error('Abonelik ID gerekli')
  await prisma.subscription.update({ where: { id: subscriptionId }, data: { active: false, canceledAt: new Date() } })
  revalidatePath(`/admin/members/${userId}`)
}
