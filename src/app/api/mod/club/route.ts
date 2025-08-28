import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if ((session as any)?.role !== 'MODERATOR') return new Response('Unauthorized', { status: 401 })
  const form = await req.formData()
  const id = form.get('id') as string
  const name = form.get('name') as string
  const description = (form.get('description') as string) || null
  const bannerUrl = (form.get('bannerUrl') as string) || null
  await prisma.club.update({ where: { id }, data: { name, description, bannerUrl } })
  return new Response(null, { status: 302, headers: { Location: '/moderator/club' } })
}
