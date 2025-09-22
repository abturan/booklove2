// src/app/api/paytr/callback/route.ts
import { NextRequest } from 'next/server'
import { getPaytrEnv, verifyCallbackHash } from '@/lib/paytr'

// PayTR callback için: yönlendirme YOK, auth YOK, sadece düz metin cevap.
// Edge yerine Node.js runtime kullan (form parse ve ağ uyumu için).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper: hem x-www-form-urlencoded hem multipart/form-data al
async function readParams(req: NextRequest): Promise<URLSearchParams> {
  const ctype = req.headers.get('content-type') || ''
  if (ctype.includes('application/x-www-form-urlencoded')) {
    const raw = await req.text()
    return new URLSearchParams(raw)
  }
  // multipart/form-data veya diğerleri
  const fd = await req.formData()
  const sp = new URLSearchParams()
  for (const [k, v] of fd.entries()) sp.append(k, String(v))
  return sp
}

export async function POST(req: NextRequest) {
  try {
    const { merchantKey, merchantSalt } = getPaytrEnv()
    const params = await readParams(req)

    const merchant_oid = params.get('merchant_oid') ?? ''
    const status = params.get('status') ?? ''
    const total_amount = params.get('total_amount') ?? ''
    const incomingHash = params.get('hash') ?? ''
    const failed_reason_code = params.get('failed_reason_code') ?? ''
    const failed_reason_msg = params.get('failed_reason_msg') ?? ''
    const test_mode = params.get('test_mode') ?? '0'

    // Hash doğrulaması
    const okHash = verifyCallbackHash({
      merchantKey,
      merchantSalt,
      merchantOid: merchant_oid,
      status,
      totalAmount: total_amount,
      incomingHash,
    })

    if (!okHash) {
      // HATALI: PayTR panelinde "Sitenizden Gelen Yanıt"ta bu metin görünür
      return new Response('HASH_MISMATCH', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // TODO: idempotent kayıt/iş mantığı — merchant_oid eşsizdir
    // status === 'success' => aboneliği aktifleştir
    // status === 'failed'  => başarısız kaydı oluştur (failed_reason_* alanlarını logla)

    // ÖNEMLİ: yalnızca düz metin "OK" dön
    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  } catch (err: any) {
    // Uygulama hatası
    return new Response(`ERROR:${err?.message || 'UNKNOWN'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

// (İsteğe bağlı) GET sağlık kontrolü: PayTR kullanmaz ama sizin testiniz için
export async function GET() {
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}
