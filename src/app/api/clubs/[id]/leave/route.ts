import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.email) return Response.json({ ok: false }, { status: 401 })
  const me = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!me) return Response.json({ ok: false }, { status: 404 })

  await prisma.membership.updateMany({
    where: { userId: me.id, clubId: params.id },
    data: { isActive: false }
  })
  await prisma.subscription.updateMany({
    where: { userId: me.id, clubId: params.id },
    data: { active: false, canceledAt: new Date() }
  })
  return Response.redirect('/profile')
}
