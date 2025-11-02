// src/app/api/paytr/get-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { alertTicket, alertError } from '@/lib/adminAlert'
import {
  getPaytrEnv,
  getClientIp,
  buildIframePaytrToken,
  toPaytrBasketBase64,
  amountToKurus,
} from '@/lib/paytr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function makeMerchantOid(clubId: string, eventId: string) {
  const cleanedClub = String(clubId).replace(/[^A-Za-z0-9]/g, '')
  const cleanedEvent = String(eventId).replace(/[^A-Za-z0-9]/g, '')
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  return (`SUB${cleanedClub}${cleanedEvent}${t}${r}`).slice(0, 64)
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id || null
    const requestOrigin = req.nextUrl?.origin || new URL(req.url).origin
    const body = await req.json()
    const originOverride =
      typeof body?.origin === 'string' && body.origin.trim().startsWith('http')
        ? body.origin.trim()
        : null
    const {
      merchantId,
      merchantKey,
      merchantSalt,
      baseUrl,
      testMode,
    } = getPaytrEnv(originOverride || requestOrigin)

    const {
      email,
      userName,
      userAddress,
      userPhone,
      amount,
      clubId,
      clubName,
      redirectSlug,
      clubEventId,
      clubEventTitle,
      noInstallment = 0,
      maxInstallment = 0,
      currency = 'TL',
      lang = 'tr',
    } = body

    if (!email || !amount || !clubId || !clubName || !redirectSlug || !clubEventId) {
      return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
    }

    const event = await prisma.clubEvent.findUnique({
      where: { id: String(clubEventId) },
      select: {
        id: true,
        clubId: true,
        startsAt: true,
        title: true,
        priceTRY: true,
        capacity: true,
        club: { select: { id: true, priceTRY: true, capacity: true } },
      },
    })
    if (!event || event.clubId !== String(clubId)) {
      return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })
    }

    const effectivePrice = event.priceTRY ?? event.club.priceTRY
    const effectiveCapacity =
      typeof event.capacity === 'number' && event.capacity >= 0
        ? event.capacity
        : typeof event.club.capacity === 'number' && event.club.capacity >= 0
          ? event.club.capacity
          : null

    if (effectivePrice !== amount) {
      return NextResponse.json({ error: 'Fiyat uyuşmazlığı' }, { status: 422 })
    }

    if (typeof effectiveCapacity === 'number') {
      const activeCount = await prisma.membership.count({
        where: { clubEventId: event.id, isActive: true },
      })
      if (activeCount >= effectiveCapacity) {
        return NextResponse.json({ error: 'Kontenjan dolu' }, { status: 422 })
      }
    }

    // Require verified phone for logged-in users
    if (userId) {
      const me = await (prisma as any).user.findUnique({ where: { id: userId }, select: { phone: true, phoneVerifiedAt: true } })
      if (!me?.phone || !me.phoneVerifiedAt) {
        return NextResponse.json({ error: 'Telefon doğrulanmadı', need: 'phone_verify' }, { status: 428 })
      }
    }

    const userIp = getClientIp(req.headers)
    const merchant_oid = makeMerchantOid(String(clubId), String(clubEventId))
    const payment_amount = amountToKurus(amount)
    const basketLabel = clubEventTitle ? `${clubEventTitle} – ${clubName}` : `Etkinlik Üyeliği - ${clubName}`
    const user_basket = toPaytrBasketBase64([[basketLabel, amount.toFixed(2), 1]])
    const callbackBase = originOverride || requestOrigin || baseUrl
    const okUrl = new URL('/paytr/ok', callbackBase)
    okUrl.searchParams.set('oid', merchant_oid)
    okUrl.searchParams.set('to', redirectSlug.startsWith('/') ? redirectSlug : `/${redirectSlug}`)
    const failUrl = new URL('/paytr/fail', callbackBase)
    failUrl.searchParams.set('oid', merchant_oid)
    failUrl.searchParams.set('to', redirectSlug.startsWith('/') ? redirectSlug : `/${redirectSlug}`)

    const paytr_token = buildIframePaytrToken({
      merchantId,
      merchantKey,
      merchantSalt,
      userIp,
      merchantOid: merchant_oid,
      email,
      paymentAmountInt: payment_amount,
      userBasketBase64: user_basket,
      noInstallment,
      maxInstallment,
      currency,
      testMode: Number(testMode ?? 0),
    })

    if (userId) {
      await prisma.paymentIntent.create({
        data: {
          userId,
          clubId,
          clubEventId,
          amountTRY: payment_amount,
          status: 'REQUIRES_PAYMENT',
          merchantOid: merchant_oid,
        },
      })
      try { alertTicket({ userId, clubId, eventId: clubEventId, amountTRY: amount, status: 'REQUIRES_PAYMENT', merchantOid: merchant_oid }).catch(() => {}) } catch {}
    }

    const form = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid,
      email,
      payment_amount: String(payment_amount),
      paytr_token,
      user_basket,
      debug_on: '1',
      no_installment: String(noInstallment),
      max_installment: String(maxInstallment),
      user_name: userName || 'Abone',
      user_address: userAddress || 'Türkiye',
      user_phone: userPhone || '0000000000',
      merchant_ok_url: okUrl.toString(),
      merchant_fail_url: failUrl.toString(),
      timeout_limit: '30',
      currency,
      test_mode: String(testMode ?? '0'),
      lang,
    })

    const res = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      cache: 'no-store',
    })

    const json = await res.json()
    if (json?.status !== 'success' || !json?.token) {
      console.log(json?.reason)
      return NextResponse.json({ error: json?.reason || 'PAYTR token alınamadı' }, { status: 400 })
    }

    return NextResponse.json({
      status: 'ok',
      merchant_oid,
      iframe_token: json.token,
      iframe_url: `https://www.paytr.com/odeme/guvenli/${json.token}`,
    })
  } catch (err: any) {
          console.log(err?.message)
    try { alertError('paytr_get_token', err).catch(() => {}) } catch {}

    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}
