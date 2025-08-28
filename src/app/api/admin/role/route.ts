import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if ((session as any)?.role !== 'ADMIN') return new Response('Unauthorized', { status: 401 })
  const form = await req.formData()
  const userId = form.get('userId') as string
  const role = form.get('role') as 'USER' | 'MODERATOR' | 'ADMIN'
  await prisma.user.update({ where: { id: userId }, data: { role } })
  return new Response(null, { status: 302, headers: { Location: '/admin' } })
}
