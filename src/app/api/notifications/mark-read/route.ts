// src/app/api/notifications/mark-read/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markRead } from '@/lib/notify'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : undefined
  const all = body?.all === true
  const res = await markRead({ userId: session.user.id, id, all })
  return NextResponse.json(res)
}

