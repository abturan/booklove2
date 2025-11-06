// src/app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { renderEmail } from '@/lib/emailTemplates'
import { sendMail } from '@/lib/mail'
import crypto from 'crypto'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })
  const isAdmin = session.user.role === 'ADMIN'

  const wantsJson = req.headers.get('accept')?.includes('application/json')
  const form = await req.formData()

  const getStr = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' ? v : undefined
  }
  const looksGif = (value: string | null | undefined) => {
    if (!value) return false
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return false
    if (trimmed.startsWith('data:image/gif')) return true
    const base = trimmed.split('#')[0].split('?')[0]
    return base.endsWith('.gif')
  }

  const id = getStr('id') || ''

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerifiedAt: true, name: true, username: true },
  })
  if (!me || (id && me.id !== id)) {
    return wantsJson
      ? NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      : new Response('Forbidden', { status: 403 })
  }

  const data: Record<string, any> = {}
  let emailChanged = false
  let newEmail: string | null = null
  let requestIncludedEmail = false

  if (form.has('name')) data.name = getStr('name') ?? ''
  if (form.has('city')) data.city = (getStr('city') ?? null)
  if (form.has('bio')) data.bio = (getStr('bio') ?? null)

  if (form.has('avatarUrl')) {
    const raw = getStr('avatarUrl')
    if (!isAdmin && looksGif(raw ?? null)) {
      const body = { ok: false, error: 'Sadece admin kullanıcıları GIF avatar kullanabilir.' }
      return wantsJson
        ? NextResponse.json(body, { status: 400 })
        : new Response(JSON.stringify(body), { status: 400, headers: { 'content-type': 'application/json' } })
    }
    data.avatarUrl = raw ? raw.trim() || null : null
  }

  if (form.has('bannerUrl')) {
    const raw = getStr('bannerUrl')
    if (!isAdmin && looksGif(raw ?? null)) {
      const body = { ok: false, error: 'Sadece admin kullanıcıları GIF banner kullanabilir.' }
      return wantsJson
        ? NextResponse.json(body, { status: 400 })
        : new Response(JSON.stringify(body), { status: 400, headers: { 'content-type': 'application/json' } })
    }
    data.bannerUrl = raw ? raw.trim() || null : null
  }

  if (form.has('username')) {
    const raw = getStr('username') || ''
    const username = raw.trim().toLowerCase()
    if (username) {
      const ok = /^[a-z0-9._-]{3,30}$/.test(username)
      if (!ok) {
        const body = { ok: false, error: 'Geçersiz kullanıcı adı. Sadece a-z 0-9 . _ - ve 3-30 karakter.' }
        return wantsJson
          ? NextResponse.json(body, { status: 400 })
          : new Response(JSON.stringify(body), {
              status: 400,
              headers: { 'content-type': 'application/json' },
            })
      }
      data.username = username
    }
    // Boş username gönderildiyse eskisi korunur (eski davranışa uyum)
  }

  // Allow changing email only if current email is NOT verified
  if (form.has('email')) {
    requestIncludedEmail = true
    const raw = (getStr('email') || '').trim()
    if (raw && raw !== me.email) {
      if (me.emailVerifiedAt) {
        const body = { ok: false, error: 'Doğrulanmış e‑posta değiştirilemez.' }
        return wantsJson
          ? NextResponse.json(body, { status: 400 })
          : new Response(JSON.stringify(body), { status: 400, headers: { 'content-type': 'application/json' } })
      }
      const exists = await prisma.user.findUnique({ where: { email: raw } })
      if (exists) {
        const body = { ok: false, error: 'Bu e‑posta zaten kullanılıyor.' }
        return wantsJson
          ? NextResponse.json(body, { status: 409 })
          : new Response(JSON.stringify(body), { status: 409, headers: { 'content-type': 'application/json' } })
      }
      data.email = raw
      data.emailVerifiedAt = null
      emailChanged = true
      newEmail = raw
    }
  }

  if (Object.keys(data).length === 0) {
    const body = { ok: false, error: 'No fields provided' }
    return wantsJson
      ? NextResponse.json(body, { status: 400 })
      : new Response(JSON.stringify(body), { status: 400, headers: { 'content-type': 'application/json' } })
  }

  try {
    await prisma.user.update({ where: { id: me.id }, data })

    // If email changed OR user explicitly submitted email while unverified, send verification mail
    if ((emailChanged && newEmail) || (requestIncludedEmail && !me.emailVerifiedAt)) {
      const sendTo = emailChanged && newEmail ? newEmail : me.email!
      const token = crypto.randomBytes(24).toString('hex')
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48)
      await (prisma as any).emailVerificationToken.create({ data: { userId: me.id, email: sendTo, token, expiresAt } })

      const base = (() => {
        try { return new URL(req.url).origin } catch { return process.env.NEXT_PUBLIC_SITE_URL || '' }
      })()
      const verifyUrl = new URL('/api/auth/verify-email', base || 'http://localhost:3000')
      verifyUrl.searchParams.set('token', token)
      const greet = me.username ? `@${me.username}` : (me.name || sendTo)
      const html = renderEmail({
        title: 'Boook.love — E‑posta doğrulaması',
        bodyHtml: `<p>Merhaba <b>${greet}</b>,<br/>Yeni e‑posta adresini doğrulamalısın.</p>`,
        ctaLabel: 'E‑postamı doğrula',
        ctaUrl: verifyUrl.toString(),
      })
      await sendMail(sendTo, 'Boook.love — E‑posta doğrulaması', html)
    }

    if (wantsJson) return NextResponse.json({ ok: true, emailChanged })
    return new Response(null, { status: 302, headers: { Location: '/profile/settings' } })
  } catch (e: any) {
    const msg: string = String(e?.message || '')
    if (msg.includes('Unique constraint failed') || msg.includes('P2002')) {
      const body = { ok: false, error: 'Bu kullanıcı adı zaten kullanılıyor.' }
      return wantsJson
        ? NextResponse.json(body, { status: 409 })
        : new Response(JSON.stringify(body), { status: 409, headers: { 'content-type': 'application/json' } })
    }
    const body = { ok: false, error: 'Profil güncellenemedi.', detail: msg }
    return wantsJson
      ? NextResponse.json(body, { status: 500 })
      : new Response(JSON.stringify(body), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}
