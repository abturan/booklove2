// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listNotifications } from '@/lib/notify'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50)
  const page = Math.max(Number(searchParams.get('page') || '1'), 1)

  const items = await listNotifications(session.user.id, limit, page)
  return NextResponse.json({ items })
}

