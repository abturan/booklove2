// src/app/admin/ads/[id]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ensureAdsSchema } from '@/lib/ensureAdsSchema'
import { redirect } from 'next/navigation'
import CampaignForm from '@/components/admin/CampaignForm'
import CreativeManager from '@/components/admin/CreativeManager'
import { updateCampaign, createCreative, deleteCreative, toggleCreative, updateCreative, reorderCreatives } from '../actions'

export const dynamic = 'force-dynamic'

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  await ensureAdsSchema()

  const campaign = await (prisma as any).adCampaign.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, type: true, frequency: true, scope: true, active: true, createdAt: true, updatedAt: true },
  })
  if (!campaign) redirect('/admin/ads')

  const creatives = await (prisma as any).ad.findMany({
    where: { campaignId: params.id },
    orderBy: [{ weight: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      type: true,
      device: true,
      imageUrl: true,
      mobileImageUrl: true,
      desktopImageUrl: true,
      linkUrl: true,
      active: true,
      createdAt: true,
      weight: true,
      html: true,
      mobileHtml: true,
      desktopHtml: true,
    },
  })

  const updateAction = updateCampaign.bind(null, campaign.id)
  const createCreativeAction = createCreative
  const reorderAction = reorderCreatives.bind(null, campaign.id)
  const creativeEntries = creatives.map((ad: any) => ({
    ...ad,
    updateAction: updateCreative.bind(null, ad.id),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{campaign.name}</h2>
        <p className="text-sm text-gray-500">Kampanya ID: {campaign.id}</p>
      </div>

      <CampaignForm
        initial={campaign}
        submitAction={updateAction}
      />

      <CreativeManager
        campaignId={campaign.id}
        creatives={creativeEntries}
        createAction={createCreativeAction}
        reorderAction={reorderAction}
        deleteAction={deleteCreative}
        toggleAction={toggleCreative}
      />
    </div>
  )
}
