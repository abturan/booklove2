// src/app/api/paytr/notify/route.ts
import { NextResponse } from 'next/server'
import { getPaytrEnv, verifyCallbackHash } from '@/lib/paytr'

export async function POST(req: Request) {
try {
const form = await req.formData()
const merchant_oid = String(form.get('merchant_oid') ?? '')
const status = String(form.get('status') ?? '')
const total_amount = String(form.get('total_amount') ?? '')
const incomingHash = String(form.get('hash') ?? '')
if (!merchant_oid || !status || !total_amount || !incomingHash) {
  return new NextResponse('BAD', { status: 400 })
}

const { merchantKey, merchantSalt } = getPaytrEnv()
const ok = verifyCallbackHash({
  merchantKey,
  merchantSalt,
  merchantOid: merchant_oid,
  status,
  totalAmount: total_amount,
  incomingHash,
})
if (!ok) {
  return new NextResponse('BAD', { status: 400 })
}

return new NextResponse('OK')
} catch {
return new NextResponse('BAD', { status: 500 })
}
}