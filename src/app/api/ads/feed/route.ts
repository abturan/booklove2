// src/app/api/ads/feed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const device = (url.searchParams.get('device') || 'all').toLowerCase()
    const scope = (url.searchParams.get('scope') || 'global').toLowerCase()

    const campaigns = await (prisma as any).adCampaign.findMany({
      where: {
        active: true,
        scope: { in: ['all', scope] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        frequency: true,
        scope: true,
        Ads: {
          where: {
            active: true,
            OR: [
              { device: 'all' },
              { device },
            ],
          },
          orderBy: { weight: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            imageUrl: true,
            mobileImageUrl: true,
            desktopImageUrl: true,
            linkUrl: true,
            html: true,
            mobileHtml: true,
            desktopHtml: true,
            device: true,
            updatedAt: true,
          },
        },
      },
    })

    const items = (campaigns || []).map((campaign: any) => ({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        frequency: campaign.frequency,
        scope: campaign.scope,
      },
      creatives: (campaign.Ads || []).map((ad: any) => ({
        ...ad,
        resolvedImageUrl: device === 'mobile' ? (ad.mobileImageUrl || ad.imageUrl) : (ad.desktopImageUrl || ad.imageUrl),
        resolvedHtml: device === 'mobile' ? (ad.mobileHtml || ad.html) : (ad.desktopHtml || ad.html),
      })),
    }))

    return NextResponse.json({ campaigns: items })
  } catch (e: any) {
    return NextResponse.json({ campaigns: [] })
  }
}
