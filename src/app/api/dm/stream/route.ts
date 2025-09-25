// src/app/api/dm/stream/route.ts
import { sseHeaders, formatEvent, dmEmitter } from '@/lib/realtime'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = session.user.id

  const url = new URL(req.url)
  const threadId = url.searchParams.get('threadId') || ''
  if (!threadId) return NextResponse.json({ error: 'Bad Request' }, { status: 400 })

  const t = await prisma.dmThread.findUnique({ where: { id: threadId } })
  if (!t) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  if (!(t.userAId === me || t.userBId === me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(':ok\n\n'))
      const onMsg = (p: any) => {
        if (p.threadId !== threadId) return
        controller.enqueue(new TextEncoder().encode(formatEvent(p.message)))
      }
      const heartbeat = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(':hb\n\n'))
      }, 15000)
      dmEmitter.on('message', onMsg)
      const close = () => {
        clearInterval(heartbeat)
        dmEmitter.off('message', onMsg)
        controller.close()
      }
      ;(req as any).signal?.addEventListener('abort', close)
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}
