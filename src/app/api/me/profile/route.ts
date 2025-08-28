import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Yetkisiz', ok: false }, { status: 401 })
  }

  try {
    const { name, bio, avatarUrl } = await req.json()
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null
      }
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Kayıt hatası' }, { status: 500 })
  }
}
