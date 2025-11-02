// src/app/api/phone/send-code/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSms } from '@/lib/sms'

function toE164(raw: string): string | null {
  const only = String(raw).replace(/[^\d+]/g, '')
  if (only.startsWith('+') && /^\+\d{10,15}$/.test(only)) return only
  // Simple TR normalization if configured
  const country = (process.env.SMS_DEFAULT_COUNTRY || '').toUpperCase()
  if (country === 'TR') {
    const digits = only.replace(/\D/g, '')
    if (/^0\d{10}$/.test(digits)) return `+90${digits.slice(1)}`
    if (/^5\d{9}$/.test(digits)) return `+90${digits}`
    if (/^90\d{10}$/.test(digits)) return `+${digits}`
  }
  // Fallback: if it looks like national but not international, reject
  return /^\+?\d{10,15}$/.test(only) ? (only.startsWith('+') ? only : `+${only}`) : null
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { phone } = await req.json().catch(() => ({}))
  const normalized = phone ? toE164(String(phone)) : null
  if (!normalized) return NextResponse.json({ error: 'Geçerli telefon girin (örn. +90 5xx xxx xx xx)' }, { status: 400 })

  const userId = session.user.id
  const now = new Date()
  const existing = await (prisma as any).phoneVerification.findFirst({ where: { userId, verifiedAt: null }, orderBy: { createdAt: 'desc' } })
  if (existing) {
    const diffMs = now.getTime() - existing.createdAt.getTime()
    const cooldownMs = 60_000
    if (diffMs < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - diffMs) / 1000)
      return NextResponse.json({ ok: false, error: 'Kod zaten gönderildi. Lütfen biraz bekleyin.', retryAfter }, { status: 429 })
    }
  }
  const code = (Math.floor(100000 + Math.random() * 900000)).toString()
  const expiresAt = new Date(now.getTime() + 10 * 60_000)
  await (prisma as any).phoneVerification.create({ data: { userId, phone: normalized, code, expiresAt } })
  let debug: string | undefined
  try {
    await sendSms(normalized, `Boook.love doğrulama kodunuz: ${code}`)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'SMS gönderilemedi' }, { status: 500 })
  }
  if ((process.env.SMS_PROVIDER || '') !== 'twilio' && process.env.NODE_ENV !== 'production') {
    debug = code
  }
  return NextResponse.json({ ok: true, debug })
}
