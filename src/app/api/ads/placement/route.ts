// src/app/api/ads/placement/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const slot = (url.searchParams.get('slot') || 'hero').toLowerCase()
  const device = (url.searchParams.get('device') || 'all').toLowerCase()
  const now = new Date()
  try {
    const rows = await (prisma as any).ad.findMany({
      where: {
        slot,
        active: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
      },
      orderBy: [{ weight: 'desc' }, { updatedAt: 'desc' }],
      take: 6,
      select: {
        id: true, title: true, type: true, slot: true,
        imageUrl: true, mobileImageUrl: true, desktopImageUrl: true,
        linkUrl: true,
        html: true, mobileHtml: true, desktopHtml: true,
        device: true, startsAt: true, endsAt: true,
      },
    })
    const items = (rows || [])
      .filter((a: any) => !a.endsAt || new Date(a.endsAt) >= now)
      .filter((a: any) => a.device === 'all' || a.device === device)
      .map((a: any) => ({
        ...a,
        resolvedImageUrl: device === 'mobile' ? (a.mobileImageUrl || a.imageUrl) : (a.desktopImageUrl || a.imageUrl),
        resolvedHtml: device === 'mobile' ? (a.mobileHtml || a.html) : (a.desktopHtml || a.html),
      }))
    return NextResponse.json({ item: items[0] || null })
  } catch (e) {
    // Fallback to raw for older Prisma Client builds
    try {
      const rows: any[] = await (prisma as any).$queryRaw`SELECT id, title, type, slot, "imageUrl", "mobileImageUrl", "desktopImageUrl", "linkUrl", html, "mobileHtml", "desktopHtml", device, "startsAt", "endsAt" FROM "Ad" WHERE slot = ${slot} AND active = true ORDER BY weight DESC, "updatedAt" DESC LIMIT 6`
      const items = rows
        .filter((r) => !r.endsAt || new Date(r.endsAt) >= now)
        .filter((r) => (r.device === 'all' || r.device === device))
        .map((r) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          slot: r.slot,
          imageUrl: r.imageUrl ?? null,
          mobileImageUrl: r.mobileImageUrl ?? null,
          desktopImageUrl: r.desktopImageUrl ?? null,
          linkUrl: r.linkUrl ?? null,
          html: r.html ?? null,
          mobileHtml: r.mobileHtml ?? null,
          desktopHtml: r.desktopHtml ?? null,
          device: r.device ?? 'all',
          resolvedImageUrl: device === 'mobile' ? (r.mobileImageUrl || r.imageUrl) : (r.desktopImageUrl || r.imageUrl),
          resolvedHtml: device === 'mobile' ? (r.mobileHtml || r.html) : (r.desktopHtml || r.html),
        }))
      return NextResponse.json({ item: items[0] || null })
    } catch {
      return NextResponse.json({ item: null })
    }
  }
}

