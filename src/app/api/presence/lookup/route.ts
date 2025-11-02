// src/app/api/presence/lookup/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const THRESHOLD_MIN = 5

export async function GET(req: Request) {
  const url = new URL(req.url)
  const idsParam = url.searchParams.get('ids') || ''
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) return NextResponse.json({ items: {}, thresholdMin: THRESHOLD_MIN })
  const since = new Date(Date.now() - THRESHOLD_MIN * 60 * 1000)
  const rows = await prisma.user.findMany({ where: { id: { in: ids }, lastSeenAt: { gte: since } }, select: { id: true } })
  const set = new Set(rows.map((r) => r.id))
  const items = ids.reduce<Record<string, boolean>>((acc, id) => { acc[id] = set.has(id); return acc }, {})
  return NextResponse.json({ items, thresholdMin: THRESHOLD_MIN })
}

