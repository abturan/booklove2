import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
    }

    const name: string = (body.name || '').trim()
    const description: string = body.description || ''
    const priceTRY: number = Number(body.priceTRY || 0)
    const bannerUrl: string = body.bannerUrl || ''
    const moderatorId: string | undefined = body.moderatorId

    if (!name) return NextResponse.json({ error: 'Kulüp adı zorunlu' }, { status: 400 })
    if (!moderatorId) return NextResponse.json({ error: 'Moderatör seçin' }, { status: 400 })

    // ——— İş kuralı: Bir moderatör yalnızca 1 kulüp yönetebilir
    const already = await prisma.club.findFirst({
      where: { moderatorId },
      select: { id: true, name: true, slug: true },
    })
    if (already) {
      return NextResponse.json(
        { error: 'Bu moderatör zaten bir kulüp yönetiyor. Lütfen başka bir moderatör seçin.' },
        { status: 409 }
      )
    }

    // ——— Slug üret ve benzersizleştir
    const base = slugify(name) || 'kulup'
    let slug = base
    let i = 1
    while (await prisma.club.findUnique({ where: { slug } })) {
      slug = `${base}-${++i}`
    }

    const created = await prisma.club.create({
      data: {
        name,
        slug,
        description,
        priceTRY,
        bannerUrl,
        moderatorId,
        published: false,
      },
      select: { id: true, slug: true },
    })

    // Optional: notify all users about new club
    try {
      const users = await prisma.user.findMany({ select: { id: true } })
      if (users.length > 0) {
        const payloadObj = { clubId: created.id, clubName: name, url: `/clubs/${slug}` }
        const payload = JSON.stringify(payloadObj)
        await prisma.notification.createMany({ data: users.map((u) => ({ userId: u.id, type: 'club_created', payload })) })
        // email broadcast (lightweight: cap at 500 to avoid long response)
        const { sendNotificationEmail } = await import('@/lib/notify-email')
        for (const u of users.slice(0, 500)) {
          sendNotificationEmail(u.id, 'club_created', payloadObj).catch(() => {})
        }
      }
    } catch (err) {
      console.error('notify club created error', err)
    }

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    // Yarış koşullarında yine de P2002 düşebilir
    if (err?.code === 'P2002' && Array.isArray(err?.meta?.target) && err.meta.target.includes('moderatorId')) {
      return NextResponse.json(
        { error: 'Bu moderatör zaten bir kulüp yönetiyor. Lütfen başka bir moderatör seçin.' },
        { status: 409 }
      )
    }
    console.error('POST /api/admin/clubs error:', err)
    return NextResponse.json({ error: err?.message || 'Sunucu hatası' }, { status: 500 })
  }
}
