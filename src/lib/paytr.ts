// src/lib/paytr.ts
import crypto from 'crypto'

export type PaytrEnv = {
  merchantId: string
  merchantKey: string
  merchantSalt: string
  baseUrl: string
  testMode: string
}

export function getPaytrEnv(baseUrlFallback?: string): PaytrEnv {
  const {
    PAYTR_MERCHANT_ID,
    PAYTR_MERCHANT_KEY,
    PAYTR_MERCHANT_SALT,
    APP_BASE_URL,
    PAYTR_TEST_MODE,
  } = process.env

  const baseUrl = baseUrlFallback || APP_BASE_URL

  if (!PAYTR_MERCHANT_ID || !PAYTR_MERCHANT_KEY || !PAYTR_MERCHANT_SALT || !baseUrl) {
    throw new Error('PayTR env vars missing.')
  }
  return {
    merchantId: PAYTR_MERCHANT_ID,
    merchantKey: PAYTR_MERCHANT_KEY,
    merchantSalt: PAYTR_MERCHANT_SALT,
    baseUrl,
    testMode: PAYTR_TEST_MODE ?? '0',
  }
}

// PayTR STEP 1 token formula (iFrame API)
export function buildIframePaytrToken(args: {
  merchantId: string
  merchantKey: string
  merchantSalt: string
  userIp: string
  merchantOid: string
  email: string
  paymentAmountInt: number // 34.56 TL -> 3456
  userBasketBase64: string
  noInstallment: number
  maxInstallment: number
  currency: 'TL' | 'USD' | 'EUR' | 'GBP' | 'RUB'
  testMode: number
}) {
  const {
    merchantId,
    merchantKey,
    merchantSalt,
    userIp,
    merchantOid,
    email,
    paymentAmountInt,
    userBasketBase64,
    noInstallment,
    maxInstallment,
    currency,
    testMode,
  } = args

  const hashStr =
    merchantId +
    userIp +
    merchantOid +
    email +
    String(paymentAmountInt) +
    userBasketBase64 +
    String(noInstallment) +
    String(maxInstallment) +
    currency +
    String(testMode)

  const data = hashStr + merchantSalt
  const hmac = crypto.createHmac('sha256', merchantKey).update(data).digest('base64')
  return hmac
}

// STEP 2 callback hash check
export function verifyCallbackHash(args: {
  merchantKey: string
  merchantSalt: string
  merchantOid: string
  status: string
  totalAmount: string // already *100 from PayTR
  incomingHash: string
}) {
  const { merchantKey, merchantSalt, merchantOid, status, totalAmount, incomingHash } = args
  const merge = `${merchantOid}${merchantSalt}${status}${totalAmount}`
  const expected = crypto.createHmac('sha256', merchantKey).update(merge).digest('base64')
  return expected === incomingHash
}

export function getClientIp(headers: Headers): string {
  const h = (k: string) => headers.get(k) || ''
  const cand =
    h('x-forwarded-for').split(',')[0].trim() ||
    h('x-real-ip') ||
    h('cf-connecting-ip') ||
    ''
  return cand || '127.0.0.1'
}

export function toPaytrBasketBase64(items: Array<[string, string, number]>): string {
  // Example: [["Üyelik - Kulüp X", "99.90", 1]]
  return Buffer.from(JSON.stringify(items), 'utf8').toString('base64')
}

export function amountToKurus(amount: number): number {
  // 99.90 -> 9990
  return Math.round(amount * 100)
}
