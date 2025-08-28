import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return new Response('Unauthorized', { status: 401 })
  const form = await req.formData()
  const id = form.get('id') as string
  const name = form.get('name') as string
  const city = (form.get('city') as string) || null
  const bio = (form.get('bio') as string) || null

  await prisma.user.update({ where: { id }, data: { name, city, bio } })
  return new Response(null, { status: 302, headers: { Location: '/profile/settings' } })
}
