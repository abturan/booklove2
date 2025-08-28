import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { monthKey } from '@/lib/utils'

export async function POST(req: Request) {
  const session = await auth()
  if ((session as any)?.role !== 'MODERATOR') return new Response('Unauthorized', { status: 401 })
  const form = await req.formData()
  const clubId = form.get('clubId') as string
  const title = form.get('title') as string
  const author = form.get('author') as string
  const coverUrl = (form.get('coverUrl') as string) || null

  const book = await prisma.book.create({ data: { title, author, coverUrl } })
  // clear previous current
  await prisma.clubPick.updateMany({ where: { clubId, isCurrent: true }, data: { isCurrent: false } })
  await prisma.clubPick.create({ data: { clubId, bookId: book.id, isCurrent: true, monthKey: monthKey() } })

  return new Response(null, { status: 302, headers: { Location: '/moderator/club' } })
}
