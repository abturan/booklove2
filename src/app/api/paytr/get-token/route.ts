// src/app/api/paytr/get-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  getPaytrEnv,
  getClientIp,
  buildIframePaytrToken,
  toPaytrBasketBase64,
  amountToKurus,
} from '@/lib/paytr'

function makeMerchantOid(clubId: string) {
  // PayTR: sadece alfanümerik izinli. Özel karakter içermemeli.
  // Örn: "SUB" + sanitized clubId + time base36 + random base36
  const cleanedClub = String(clubId).replace(/[^A-Za-z0-9]/g, '')
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 8)
  const oid = `SUB${cleanedClub}${t}${r}`.replace(/[^A-Za-z0-9]/g, '')
  // Uzunluk emniyeti (PayTR sınırı 64 karakter varsayımıyla)
  return oid.slice(0, 64)
}

export async function POST(req: NextRequest) {
  try {
    const { merchantId, merchantKey, merchantSalt, baseUrl, testMode } = getPaytrEnv()
    const body = await req.json()

    const {
      email,
      userName,
      userAddress,
      userPhone,
      amount, // number, TL
      clubId,
      clubName,
      redirectSlug, // e.g. clubs/my-club
      noInstallment = 0,
      maxInstallment = 0,
      currency = 'TL',
      lang = 'tr',
    } = body

    if (!email || !amount || !clubId || !clubName || !redirectSlug) {
      return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
    }

    const userIp = getClientIp(req.headers)
    const merchant_oid = makeMerchantOid(clubId)
    const payment_amount = amountToKurus(amount)
    const user_basket = toPaytrBasketBase64([[`Üyelik - ${clubName}`, amount.toFixed(2), 1]])

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
      merchant_ok_url: `${baseUrl}/paytr/ok?oid=${encodeURIComponent(
        merchant_oid,
      )}&to=/${redirectSlug}`,
      merchant_fail_url: `${baseUrl}/paytr/fail?oid=${encodeURIComponent(
        merchant_oid,
      )}&to=/${redirectSlug}`,
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
      return NextResponse.json({ error: json?.reason || 'PAYTR token alınamadı' }, { status: 400 })
    }

    return NextResponse.json({
      status: 'ok',
      merchant_oid,
      iframe_token: json.token,
      iframe_url: `https://www.paytr.com/odeme/guvenli/${json.token}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}
