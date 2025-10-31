import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if ((session as any)?.role !== 'MODERATOR') return new Response('Unauthorized', { status: 401 })
  const form = await req.formData()
  const clubId = form.get('clubId') as string
  const title = form.get('title') as string
  const author = form.get('author') as string
  const coverUrl = (form.get('coverUrl') as string) || null

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, priceTRY: true, capacity: true },
  })
  if (!club) return new Response('Kulüp bulunamadı', { status: 404 })

  const now = new Date()
  let event = await prisma.clubEvent.findFirst({
    where: { clubId, startsAt: { gte: now } },
    orderBy: { startsAt: 'asc' },
  })

  if (!event) {
    event = await prisma.clubEvent.findFirst({
      where: { clubId },
      orderBy: { startsAt: 'desc' },
    })
  }

  if (!event) {
    event = await prisma.clubEvent.create({
      data: {
        clubId,
        startsAt: now,
        title: 'Aylık Oturum',
        priceTRY: club.priceTRY,
        capacity: club.capacity,
      },
    })
  }

  await prisma.clubEvent.update({
    where: { id: event.id },
    data: {
      bookTitle: title,
      bookAuthor: author || null,
      bookCoverUrl: coverUrl,
    },
  })

  return new Response(null, { status: 302, headers: { Location: '/moderator/club' } })
}
