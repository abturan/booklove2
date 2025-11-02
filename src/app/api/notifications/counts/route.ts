// src/app/api/notifications/counts/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { unreadCount } from '@/lib/notify'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const total = await unreadCount(session.user.id)
  return NextResponse.json({ total })
}

