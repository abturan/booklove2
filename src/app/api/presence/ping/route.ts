import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) return new Response('Unauthorized', { status: 401 })
  await prisma.user.update({
    where: { email: session.user.email },
    data: { lastSeenAt: new Date() }
  })
  return Response.json({ ok: true })
}
