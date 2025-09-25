// src/app/api/profile/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return new Response('Unauthorized', { status: 401 })

  const wantsJson = req.headers.get('accept')?.includes('application/json')
  const form = await req.formData()

  const getStr = (k: string) => {
    const v = form.get(k)
    return typeof v === 'string' ? v : undefined
  }

  const id = getStr('id') || ''

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!me || (id && me.id !== id)) {
    return wantsJson
      ? NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      : new Response('Forbidden', { status: 403 })
  }

  const data: Record<string, any> = {}

  if (form.has('name')) data.name = getStr('name') ?? ''
  if (form.has('city')) data.city = (getStr('city') ?? null)
  if (form.has('bio')) data.bio = (getStr('bio') ?? null)

  if (form.has('avatarUrl')) {
    const raw = getStr('avatarUrl')
    data.avatarUrl = raw ? raw.trim() || null : null
  }

  if (form.has('bannerUrl')) {
    const raw = getStr('bannerUrl')
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

  if (Object.keys(data).length === 0) {
    const body = { ok: false, error: 'No fields provided' }
    return wantsJson
      ? NextResponse.json(body, { status: 400 })
      : new Response(JSON.stringify(body), { status: 400, headers: { 'content-type': 'application/json' } })
  }

  try {
    await prisma.user.update({ where: { id: me.id }, data })
    if (wantsJson) return NextResponse.json({ ok: true })
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
