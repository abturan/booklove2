// src/app/api/paytr/callback/route.ts
import { NextRequest } from 'next/server'

/**
 * PayTR 2. Adım callback endpoint’i
 *
 * ✔ Node.js runtime (Edge değil)
 * ✔ "www" kanonik domainde çalışır; redirect YOK
 * ✔ Content-Type eksik/yanlış gelse bile parse etmeye çalışır
 * ✔ Her durumda en sonda düz METİN "OK" döner (PayTR tekrar denemesin diye)
 * ✔ Doğrulama ve iş mantığı başarısızsa LOG'lar; OK dönmeye devam eder
 *
 * NOT: Güvenlik/entegrasyon politikana göre "STRICT" mod açıp hash uyuşmazlığında 400 döndürebilirsin.
 * Varsayılan: STRICT kapalı → her koşulda "OK".
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const preferredRegion = ['ist1', 'fra1', 'cdg1'] // Vercel bölgeleri (opsiyonel yakına pin)

const STRICT_MODE = process.env.PAYTR_CALLBACK_STRICT === '1' // 1 ise hash mismatch'te 400 döner
const DIAG_MODE = process.env.PAYTR_CALLBACK_DIAG === '1'     // 1 ise direkt OK (teşhis)

type PaytrParams = {
  merchant_oid: string
  status: 'success' | 'failed' | string
  total_amount: string
  hash: string
  failed_reason_code?: string
  failed_reason_msg?: string
  test_mode?: string
}

// ——— Entegrasyon gizleri (.env’den oku) ———
function getPaytrSecrets() {
  const merchant_key = process.env.PAYTR_MERCHANT_KEY || ''
  const merchant_salt = process.env.PAYTR_MERCHANT_SALT || ''
  if (!merchant_key || !merchant_salt) {
    throw new Error('PAYTR_MERCHANT_KEY/SALT eksik')
  }
  return { merchant_key, merchant_salt }
}

// PHP örneğindeki ile bire bir aynı hesap:
function computeHash(p: PaytrParams, merchant_key: string, merchant_salt: string) {
  const src = `${p.merchant_oid}${merchant_salt}${p.status}${p.total_amount}`
  // base64_encode( hash_hmac('sha256', src, merchant_key, true) )
  const hmac = require('crypto').createHmac('sha256', merchant_key).update(src).digest()
  return Buffer.from(hmac).toString('base64')
}

function ipFromHeaders(h: Headers) {
  const xf = h.get('x-forwarded-for') || ''
  return xf.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

// PayTR farklı Content-Type’larla gelebilir; toleranslı oku
async function readParamsPermissive(req: NextRequest): Promise<URLSearchParams | null> {
  const ctype = (req.headers.get('content-type') || '').toLowerCase()

  // 1) x-www-form-urlencoded
  if (ctype.includes('application/x-www-form-urlencoded')) {
    const raw = await req.text()
    return new URLSearchParams(raw)
  }

  // 2) multipart/form-data
  if (ctype.includes('multipart/form-data')) {
    const fd = await req.formData()
    const sp = new URLSearchParams()
    for (const [k, v] of fd.entries()) sp.append(k, String(v))
    return sp
  }

  // 3) Content-Type yok/yanlış → yine de gövdeyi dene
  const raw = await req.text().catch(() => '')
  if (!raw) return null

  // a=b&c=d gibi ise
  if (raw.includes('=') && (raw.includes('&') || raw.includes('merchant_oid'))) {
    return new URLSearchParams(raw)
  }

  // JSON olabilir
  try {
    const o = JSON.parse(raw)
    const sp = new URLSearchParams()
    for (const k of [
      'merchant_oid',
      'status',
      'total_amount',
      'hash',
      'failed_reason_code',
      'failed_reason_msg',
      'test_mode',
    ]) {
      if (o?.[k] != null) sp.set(k, String(o[k]))
    }
    if ([...sp.keys()].length) return sp
  } catch {
    // ignore
  }

  return null
}

export async function POST(req: NextRequest) {
  // GELEN İSTEĞİ LOGLA
  try {
    console.log('[PAYTR_CALLBACK] incoming', {
      ip: ipFromHeaders(req.headers),
      ua: req.headers.get('user-agent') || '',
      url: req.nextUrl.href,
      ctype: req.headers.get('content-type') || '',
      strict: STRICT_MODE,
      diag: DIAG_MODE,
    })
  } catch {}

  // DIAG: direkt OK
  if (DIAG_MODE) {
    console.log('[PAYTR_CALLBACK] DIAG_MODE=1 → returning OK immediately')
    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  let parsed: URLSearchParams | null = null
  let p: PaytrParams | null = null
  let hashOk = false

  try {
    parsed = await readParamsPermissive(req)

    if (!parsed) {
      console.warn('[PAYTR_CALLBACK] params not parsed; returning OK (permissive)')
      // her koşulda OK dön → PayTR tekrar denemeyi keser
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }

    p = {
      merchant_oid: parsed.get('merchant_oid') || '',
      status: (parsed.get('status') || '') as any,
      total_amount: parsed.get('total_amount') || '',
      hash: parsed.get('hash') || '',
      failed_reason_code: parsed.get('failed_reason_code') || undefined,
      failed_reason_msg: parsed.get('failed_reason_msg') || undefined,
      test_mode: parsed.get('test_mode') || undefined,
    }

    console.log('[PAYTR_CALLBACK] params', {
      merchant_oid: p.merchant_oid,
      status: p.status,
      total_amount: p.total_amount,
      hasHash: Boolean(p.hash),
      test_mode: p.test_mode,
    })

    // Hash alanları yoksa bile OK dön (PayTR “OK aldı” görsün)
    if (!p.merchant_oid || !p.status || !p.total_amount || !p.hash) {
      console.warn('[PAYTR_CALLBACK] missing fields; returning OK (permissive)')
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }

    // HASH doğrula (PHP örneğiyle birebir)
    try {
      const { merchant_key, merchant_salt } = getPaytrSecrets()
      const expected = computeHash(p, merchant_key, merchant_salt)
      hashOk = expected === p.hash
      if (!hashOk) {
        console.error('[PAYTR_CALLBACK] HASH_MISMATCH', {
          merchant_oid: p.merchant_oid,
          expected,
          got: p.hash,
        })
        if (STRICT_MODE) {
          // STRICT açıksa 400 ver → PayTR yeniden dener
          return new Response('PAYTR notification failed: bad hash', {
            status: 400,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }
        // STRICT değilse OK dön; tekrar denemesin (sen log’dan görebilirsin)
        return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
      }
    } catch (e: any) {
      console.error('[PAYTR_CALLBACK] HASH_VERIFY_ERROR', e?.message || e)
      if (STRICT_MODE) {
        return new Response('PAYTR notification failed: verify error', {
          status: 400,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }

    // ——— Burada idempotent iş mantığı yapın ———
    // 1) p.merchant_oid ile işlemi DB’de bulun
    // 2) Eğer zaten işlendiyse hiçbir şey yapmadan OK dön
    // 3) Status success → aboneliği aktifleştir; failed → başarısızlık kaydı/log
    // Not: Bu örnekte sadece logluyoruz
    console.log('[PAYTR_CALLBACK] VERIFIED', { merchant_oid: p.merchant_oid, status: p.status })
  } catch (err: any) {
    console.error('[PAYTR_CALLBACK] UNHANDLED_ERROR', err?.message || err)
    // PayTR tekrar denemesin diye yine de OK dönüyoruz (STRICT/DIAG’a bağlı davranışını değiştirebilirsin)
    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }

  // ÖNEMLİ: En sonda her koşulda düz metin OK
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}

export async function GET() {
  // Healthcheck
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}
