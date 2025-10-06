// src/app/api/paytr/callback/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaytrEnv, verifyCallbackHash } from '@/lib/paytr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function readParams(req: NextRequest) {
  const ctype = (req.headers.get('content-type') || '').toLowerCase()
  if (ctype.includes('multipart/form-data')) {
    const fd = await req.formData()
    const g = (k: string) => String(fd.get(k) ?? '')
    return {
      merchant_oid: g('merchant_oid'),
      status: g('status'),
      total_amount: g('total_amount'),
      hash: g('hash'),
    }
  }
  const raw = await req.text().catch(() => '')
  if (!raw) return { merchant_oid: '', status: '', total_amount: '', hash: '' }
  const sp = new URLSearchParams(raw)
  return {
    merchant_oid: sp.get('merchant_oid') || '',
    status: sp.get('status') || '',
    total_amount: sp.get('total_amount') || '',
    hash: sp.get('hash') || '',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { merchantKey, merchantSalt } = getPaytrEnv()
    const p = await readParams(req)

    if (!p.merchant_oid || !p.status || !p.total_amount || !p.hash) {
      return new Response('OK', { headers: { 'Content-Type': 'text/plain' } })
    }

    const ok = verifyCallbackHash({
      merchantKey,
      merchantSalt,
      merchantOid: p.merchant_oid,
      status: p.status,
      totalAmount: p.total_amount,
      incomingHash: p.hash,
    })

    if (!ok) {
      return new Response('OK', { headers: { 'Content-Type': 'text/plain' } })
    }

    const intent = await prisma.paymentIntent.findFirst({
      where: { merchantOid: p.merchant_oid },
      select: { id: true, userId: true, clubId: true },
    })

    if (intent) {
      if (p.status === 'success') {
        await prisma.$transaction([
          prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: 'SUCCEEDED' },
          }),
          prisma.subscription.upsert({
            where: { userId_clubId: { userId: intent.userId, clubId: intent.clubId } },
            update: { active: true, startedAt: new Date(), canceledAt: null },
            create: { userId: intent.userId, clubId: intent.clubId, active: true, startedAt: new Date() },
          }),
          prisma.membership.upsert({
            where: { userId_clubId: { userId: intent.userId, clubId: intent.clubId } },
            update: { isActive: true },
            create: { userId: intent.userId, clubId: intent.clubId, isActive: true },
          }),
        ])
      } else {
        await prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'FAILED' },
        })
      }
    }

    return new Response('OK', { headers: { 'Content-Type': 'text/plain' } })
  } catch {
    return new Response('OK', { headers: { 'Content-Type': 'text/plain' } })
  }
}
