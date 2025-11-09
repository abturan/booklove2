// src/app/meet/[eventId]/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import LiveClient from './LiveClient'
import { isMeetingFeatureEnabled } from '@/lib/meet'

export const dynamic = 'force-dynamic'

export default async function MeetPage({ params }: { params: { eventId: string } }) {
  if (!isMeetingFeatureEnabled()) return notFound()
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/meet/${params.eventId}`)}`)
  }
  const ev = await prisma.clubEvent.findUnique({
    where: { id: String(params.eventId) },
    select: { id: true, title: true, club: { select: { name: true, moderatorId: true, slug: true } } },
  })
  if (!ev) return notFound()
  const role = (session.user.role || '').toUpperCase()
  const isMod = role === 'ADMIN' || role === 'MODERATOR' || ev.club.moderatorId === session.user.id
  const member = await prisma.membership.findUnique({ where: { userId_clubEventId: { userId: session.user.id, clubEventId: ev.id } }, select: { isActive: true } })
  if (!isMod && !member?.isActive) {
    redirect(`/clubs/${encodeURIComponent(ev.club.slug || '')}`)
  }
  return (
    <div className="-mx-4 sm:mx-0">
      {/* Thin red header with logo and back link */}
      <div className="relative mb-2">
        <div className="h-1 w-full bg-[#fa3d30]" />
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <img src="/logo-fixed.svg" alt="Book Love" className="h-7 w-auto" />
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">{ev.title} · {ev.club.name}</span>
          </div>
          <a href={`/clubs/${encodeURIComponent(ev.club.slug || '')}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            ← Etkinlik sayfasına dön
          </a>
        </div>
      </div>
      {/* Video + UI */}
      <LiveClient eventId={ev.id} isModerator={isMod} moderatorId={ev.club.moderatorId} meId={session.user.id} />
    </div>
  )
}
