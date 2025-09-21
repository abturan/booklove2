// src/app/api/paytr/callback/route.ts
import { NextRequest } from 'next/server'
import { getPaytrEnv, verifyCallbackHash } from '@/lib/paytr'

// Not: Bu endpoint kullanıcıya görünmez; PayTR sunucuları POST yapar.
// Dönüş tek satır "OK" olmalı; aksi halde ödeme "Devam Ediyor" kalır.
export async function POST(req: NextRequest) {
  const { merchantKey, merchantSalt } = getPaytrEnv()
  const form = await req.formData()

  const merchant_oid = String(form.get('merchant_oid') || '')
  const status = String(form.get('status') || '')
  const total_amount = String(form.get('total_amount') || '')
  const incomingHash = String(form.get('hash') || '')
  const test_mode = String(form.get('test_mode') || '0')

  const ok = verifyCallbackHash({
    merchantKey,
    merchantSalt,
    merchantOid: merchant_oid,
    status,
    totalAmount: total_amount,
    incomingHash,
  })

  if (!ok) {
    return new Response('PAYTR notification failed: bad hash', { status: 400 })
  }

  // TODO: idempotent davranın — merchant_oid eşsizdir.
  // 1) DB’de ödeme kaydını bulun/oluşturun
  // 2) status === 'success' ise aboneliği aktifleştirin; yoksa başarısız olarak işaretleyin
  // 3) toplam tutar (total_amount) kuruş cinsinden gelir

  // Önemli: Sadece düz metin "OK" dönün; HTML/JSON dönmeyin.
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}
