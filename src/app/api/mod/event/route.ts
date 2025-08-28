import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if ((session as any)?.role !== 'MODERATOR') return new Response('Unauthorized', { status: 401 })
  const form = await req.formData()
  const clubId = form.get('clubId') as string
  const startsAt = new Date(form.get('startsAt') as string)
  await prisma.clubEvent.create({ data: { clubId, startsAt } })
  return new Response(null, { status: 302, headers: { Location: '/moderator/club' } })
}
