import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data: Record<string, any> = {}
    const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : v)

    // Yalnızca gönderilen alanları PATCH et.
    if ('name' in body) {
      const v = trim(body.name)
      if (typeof v === 'string' && v.length > 0) data.name = v
      // name boş/undefined/null ise hiç dokunma (NOT NULL alan)
    }
    if ('bio' in body) {
      const v = trim(body.bio)
      data.bio = v === '' ? null : v ?? null
    }
    if ('avatarUrl' in body) {
      const v = trim(body.avatarUrl)
      data.avatarUrl = v === '' ? null : v ?? null
    }
    if ('city' in body) {
      const v = trim(body.city)
      data.city = v === '' ? null : v
    }
    if ('district' in body) {
      const v = trim(body.district)
      data.district = v === '' ? null : v
    }
    if ('phone' in body) {
      const v = trim(body.phone)
      data.phone = v === '' ? null : v
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: true })
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const msg: string = String(e?.message || '')
    // Migration hatalarını daha dar yakala
    if (msg.includes('does not exist') || msg.includes('Unknown arg')) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Veritabanı şeması güncel değil. Lütfen migrationları uygulayın: `npx prisma migrate deploy` ardından `npx prisma generate`.',
          code: 'MIGRATION_REQUIRED',
          detail: msg,
        },
        { status: 500 },
      )
    }
    return NextResponse.json(
      { ok: false, error: 'Profil güncellenemedi.', detail: msg },
      { status: 500 },
    )
  }
}
