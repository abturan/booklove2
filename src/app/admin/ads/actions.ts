// src/app/admin/ads/actions.ts
'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureAdsSchema } from '@/lib/ensureAdsSchema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function assertAdmin(session: any) {
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error('Yetkisiz işlem')
  }
}

export async function createCampaign(formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  const name = String(formData.get('name') || '').trim()
  const type = (String(formData.get('type') || 'rotate') as 'rotate' | 'pinned_top')
  const frequency = type === 'rotate' ? Math.max(1, Number(formData.get('frequency') || '1') || 1) : 0
  const active = formData.get('active') === 'on'
  const scope = String(formData.get('scope') || 'all') || 'all'
  if (!name) throw new Error('Kampanya adı zorunlu')
  const campaign = await (prisma as any).adCampaign.create({
    data: {
      name,
      type,
      frequency: type === 'rotate' ? frequency : 0,
      active,
      scope,
    },
  })
  revalidatePath('/admin/ads')
  redirect(`/admin/ads/${campaign.id}`)
}

export async function updateCampaign(id: string, formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  const campaignId = id || String(formData.get('id') || '')
  if (!campaignId) throw new Error('Kampanya bulunamadı')
  const name = String(formData.get('name') || '').trim()
  const type = (String(formData.get('type') || 'rotate') as 'rotate' | 'pinned_top')
  const frequency = type === 'rotate' ? Math.max(1, Number(formData.get('frequency') || '1') || 1) : 0
  const active = formData.get('active') === 'on'
  const scope = String(formData.get('scope') || 'all') || 'all'
  await (prisma as any).adCampaign.update({
    where: { id: campaignId },
    data: {
      name,
      type,
      frequency: type === 'rotate' ? frequency : 0,
      active,
      scope,
    },
  })
  revalidatePath(`/admin/ads/${campaignId}`)
}

export async function deleteCampaign(formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  const id = String(formData.get('id') || '')
  if (!id) return
  await (prisma as any).ad.deleteMany({ where: { campaignId: id } })
  await (prisma as any).adCampaign.delete({ where: { id } })
  revalidatePath('/admin/ads')
}

export async function createCreative(formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  const campaignId = String(formData.get('campaignId') || '')
  if (!campaignId) throw new Error('Kampanya seçilmedi')
  const title = String(formData.get('title') || '').trim()
  const type = String(formData.get('type') || 'image_full')
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null
  const mobileImageUrl = String(formData.get('mobileImageUrl') || '').trim() || null
  const desktopImageUrl = String(formData.get('desktopImageUrl') || '').trim() || null
  const linkUrl = String(formData.get('linkUrl') || '').trim() || null
  const html = String(formData.get('html') || '').trim() || null
  const mobileHtml = String(formData.get('mobileHtml') || '').trim() || null
  const desktopHtml = String(formData.get('desktopHtml') || '').trim() || null
  const device = (String(formData.get('device') || 'all').trim().toLowerCase()) || 'all'
  const active = formData.get('active') === 'on'
  const maxWeight = await (prisma as any).ad.aggregate({ where: { campaignId }, _max: { weight: true } })
  const nextWeight = (maxWeight?._max?.weight ?? 0) + 1
  await (prisma as any).ad.create({
    data: {
      title,
      type,
      slot: 'feed',
      imageUrl,
      mobileImageUrl,
      desktopImageUrl,
      linkUrl,
      html,
      mobileHtml,
      desktopHtml,
      device,
      active,
      campaignId,
      weight: nextWeight,
    },
  })
  revalidatePath(`/admin/ads/${campaignId}`)
}

export async function updateCreative(id: string, formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  const creativeId = id || String(formData.get('id') || '')
  if (!creativeId) throw new Error('Reklam bulunamadı')
  const title = String(formData.get('title') || '').trim()
  const type = String(formData.get('type') || 'image_full')
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null
  const mobileImageUrl = String(formData.get('mobileImageUrl') || '').trim() || null
  const desktopImageUrl = String(formData.get('desktopImageUrl') || '').trim() || null
  const linkUrl = String(formData.get('linkUrl') || '').trim() || null
  const html = String(formData.get('html') || '').trim() || null
  const mobileHtml = String(formData.get('mobileHtml') || '').trim() || null
  const desktopHtml = String(formData.get('desktopHtml') || '').trim() || null
  const device = (String(formData.get('device') || 'all').trim().toLowerCase()) || 'all'
  const active = formData.get('active') === 'on'
  const campaignId = String(formData.get('campaignId') || '')
  await (prisma as any).ad.update({
    where: { id: creativeId },
    data: {
      title,
      type,
      imageUrl,
      mobileImageUrl,
      desktopImageUrl,
      linkUrl,
      html,
      mobileHtml,
      desktopHtml,
      device,
      active,
    },
  })
  if (campaignId) revalidatePath(`/admin/ads/${campaignId}`)
}

export async function deleteCreative(formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  const id = String(formData.get('id') || '')
  const campaignId = String(formData.get('campaignId') || '')
  if (!id) return
  await (prisma as any).ad.delete({ where: { id } })
  if (campaignId) revalidatePath(`/admin/ads/${campaignId}`)
}

export async function toggleCreative(formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  const id = String(formData.get('id') || '')
  const active = String(formData.get('active') || '') === '1'
  const campaignId = String(formData.get('campaignId') || '')
  if (!id) return
  await (prisma as any).ad.update({ where: { id }, data: { active } })
  if (campaignId) revalidatePath(`/admin/ads/${campaignId}`)
}

export async function reorderCreatives(campaignId: string, formData: FormData) {
  const session = await auth()
  assertAdmin(session)
  await ensureAdsSchema()
  if (!campaignId) return
  let ids: string[] = []
  try {
    const raw = String(formData.get('order') || '[]')
    ids = JSON.parse(raw)
    if (!Array.isArray(ids)) ids = []
  } catch {
    ids = []
  }
  let weight = 1
  for (const id of ids) {
    if (!id) continue
    await (prisma as any).ad.update({ where: { id }, data: { weight, updatedAt: new Date() } })
    weight += 1
  }
  revalidatePath(`/admin/ads/${campaignId}`)
}
