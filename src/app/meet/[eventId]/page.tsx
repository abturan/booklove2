// src/app/meet/[eventId]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { isMeetingFeatureEnabled } from '@/lib/meet'
import { ensureConferenceFlagColumn } from '@/lib/conferenceFlag'
import MeetExperience from './MeetExperience'

export const dynamic = 'force-dynamic'

export default async function MeetPage({ params }: { params: { eventId: string } }) {
  if (!isMeetingFeatureEnabled()) return notFound()
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/meet/${params.eventId}`)}`)
  }
  await ensureConferenceFlagColumn()
  const ev = await prisma.clubEvent.findUnique({
    where: { id: String(params.eventId) },
    select: {
      id: true,
      title: true,
      club: {
        select: {
          name: true,
          moderatorId: true,
          slug: true,
          conferenceEnabled: true,
          moderator: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  })
  if (!ev) return notFound()
  if (!ev.club.conferenceEnabled) {
    redirect(`/clubs/${encodeURIComponent(ev.club.slug || '')}`)
  }
  const role = (session.user.role || '').toUpperCase()
  const isMod = role === 'ADMIN' || role === 'MODERATOR' || ev.club.moderatorId === session.user.id
  const member = await prisma.membership.findUnique({ where: { userId_clubEventId: { userId: session.user.id, clubEventId: ev.id } }, select: { isActive: true } })
  if (!isMod && !member?.isActive) {
    redirect(`/clubs/${encodeURIComponent(ev.club.slug || '')}`)
  }
  return (
    <MeetExperience
      eventId={ev.id}
      isModerator={isMod}
      clubSlug={ev.club.slug}
      eventTitle={ev.title}
      clubName={ev.club.name}
      moderatorName={ev.club.moderator?.name || null}
      moderatorAvatar={ev.club.moderator?.avatarUrl || null}
    />
  )
}
