// src/app/api/paytr/callback/route.ts
import { NextRequest } from 'next/server'
import { getPaytrEnv, verifyCallbackHash } from '@/lib/paytr'

// PayTR için Node.js runtime + dinamik
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Vercel bölge tercihi (TR/AVR yakınları)
export const preferredRegion = ['fra1', 'cdg1', 'ist1']

// Teşhis modu: .env -> PAYTR_CALLBACK_DIAG=1 ise hash bakmadan OK dön
const DIAG_MODE = process.env.PAYTR_CALLBACK_DIAG === '1'

// ——— yardımcılar ———
async function readParams(req: NextRequest): Promise<URLSearchParams> {
  const ctype = req.headers.get('content-type') || ''
  if (ctype.includes('application/x-www-form-urlencoded')) {
    const raw = await req.text()
    return new URLSearchParams(raw)
  }
  // multipart/form-data / diğerleri
  const fd = await req.formData()
  const sp = new URLSearchParams()
  for (const [k, v] of fd.entries()) sp.append(k, String(v))
  return sp
}

function ipFromHeaders(h: Headers) {
  const xf = h.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

export async function POST(req: NextRequest) {
  // ——— LOG: isteği her durumda kaydet ———
  try {
    const ip = ipFromHeaders(req.headers)
    const ua = req.headers.get('user-agent') || ''
    console.log('[PAYTR_CALLBACK] incoming', {
      ip,
      ua,
      url: req.nextUrl.href,
      diag: DIAG_MODE,
    })
  } catch {}

  try {
    const { merchantKey, merchantSalt } = getPaytrEnv()
    const params = await readParams(req)

    const merchant_oid = params.get('merchant_oid') ?? ''
    const status = params.get('status') ?? ''
    const total_amount = params.get('total_amount') ?? ''
    const incomingHash = params.get('hash') ?? ''
    const failed_reason_code = params.get('failed_reason_code') ?? ''
    const failed_reason_msg = params.get('failed_reason_msg') ?? ''
    const test_mode = params.get('test_mode') ?? ''

    // LOG: param özet
    console.log('[PAYTR_CALLBACK] params', {
      merchant_oid,
      status,
      total_amount,
      hasHash: Boolean(incomingHash),
      failed_reason_code,
      test_mode,
    })

    // DIAG: hash doğrulamasını geçici atla (sadece test için)
    if (DIAG_MODE) {
      console.log('[PAYTR_CALLBACK] DIAG_MODE=1 → returning OK immediately')
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }

    // Normal akış: hash doğrula
    const okHash = verifyCallbackHash({
      merchantKey,
      merchantSalt,
      merchantOid: merchant_oid,
      status,
      totalAmount: total_amount,
      incomingHash,
    })

    if (!okHash) {
      console.log('[PAYTR_CALLBACK] HASH_MISMATCH', { merchant_oid })
      return new Response('HASH_MISMATCH', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // TODO: buraya idempotent iş mantığını ekleyin (merchant_oid benzersiz)
    // if (status === 'success') -> aboneliği aktifleştir
    // else -> başarısız kaydı oluştur / logla
    console.log('[PAYTR_CALLBACK] VERIFIED', { merchant_oid, status })

    // PayTR gereği sadece düz OK
    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  } catch (err: any) {
    console.error('[PAYTR_CALLBACK] ERROR', err)
    return new Response(`ERROR:${err?.message || 'UNKNOWN'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

// İsteğe bağlı sağlık kontrolü
export async function GET(req: NextRequest) {
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}
