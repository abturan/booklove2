// src/app/api/friends/panel/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listFollowData } from '@/lib/follow'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const meId = session.user.id

  const { followers, following, mutual } = await listFollowData(meId)

  return NextResponse.json({
    followers,
    following,
    mutual,
    friends: mutual, // legacy key for compatibility
    incoming: [],
    outgoing: [],
  })
}
