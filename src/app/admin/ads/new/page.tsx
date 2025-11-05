// src/app/admin/ads/new/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ensureAdsSchema } from '@/lib/ensureAdsSchema'
import { createCampaign } from '../actions'
import CampaignForm from '@/components/admin/CampaignForm'

export const dynamic = 'force-dynamic'

export default async function NewCampaignPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/')

  // Defensive: ensure table/columns exist to avoid select errors in mixed envs
  await ensureAdsSchema()

  const submitAction = createCampaign.bind(null)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Yeni Kampanya</h2>
      <CampaignForm submitAction={submitAction} />
    </div>
  )
}
