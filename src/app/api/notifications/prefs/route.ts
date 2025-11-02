// src/app/api/notifications/prefs/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const pref = await (prisma as any).notificationPreference.findUnique({ where: { userId } })
  return NextResponse.json({
    ok: true,
    prefs: pref ?? {
      emailFollow: true,
      emailPostLike: true,
      emailPostComment: true,
      emailClubModeratorPost: true,
      emailClubModeratorSecret: true,
      emailClubNewMessagesDaily: true,
      emailClubCreated: true,
      emailClubNewEvent: true,
    },
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  const keys = [
    'emailFollow','emailPostLike','emailPostComment','emailClubModeratorPost','emailClubModeratorSecret','emailClubNewMessagesDaily','emailClubCreated','emailClubNewEvent'
  ]
  for (const k of keys) if (typeof body[k] === 'boolean') data[k] = body[k]
  const saved = await (prisma as any).notificationPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
  return NextResponse.json({ ok: true, prefs: saved })
}
