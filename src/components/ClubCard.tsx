// src/components/ClubCard.tsx
'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import Avatar from '@/components/Avatar'
import { Ticket, Users } from 'lucide-react'
import { userPath } from '@/lib/userPath'

type ClubItem = {
  id: string
  slug: string
  name: string
  description: string | null
  bannerUrl: string | null
  priceTRY: number
  moderator?: { id: string; name: string; avatarUrl?: string | null; username?: string | null; slug?: string | null } | null
  memberCount: number
  pickCount: number
  capacity?: number | null
}

type ClubCardProps = {
  club: ClubItem
  className?: string
}

export default function ClubCard({ club, className }: ClubCardProps) {
  const titleContainerRef = useRef<HTMLDivElement | null>(null)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const moderatorName = club.moderator?.name ?? 'Moderatör'
  const moderatorAvatar = club.moderator?.avatarUrl || null
  const hasCapacity = typeof club.capacity === 'number' && club.capacity >= 0
  const remaining = hasCapacity ? Math.max((club.capacity ?? 0) - club.memberCount, 0) : null
  const isSoldOut = hasCapacity ? (remaining ?? 0) <= 0 : false
  const lowStock = hasCapacity && (remaining ?? 0) > 0 && (remaining as number) <= 10
  const rawTitle = (club.name || '').trim()
  const dashParts = rawTitle.split('—')
  const eventTitle = dashParts.length > 1 ? dashParts[0].trim() : ''
  const parsedClub = dashParts.length > 1 ? dashParts.slice(1).join('—') : rawTitle
  const displayClubName = parsedClub.replace(/\s+/g, ' ').trim() || rawTitle

  useEffect(() => {
    const titleEl = titleRef.current
    const containerEl = titleContainerRef.current
    if (!titleEl || !containerEl) return

    const maxSize = 1.25
    const minSize = 0.65
    const step = 0.03

    const fit = () => {
      const currentTitle = titleRef.current
      const currentContainer = titleContainerRef.current
      if (!currentTitle || !currentContainer) return
      let currentSize = maxSize
      currentTitle.style.whiteSpace = 'nowrap'
      currentTitle.style.display = 'block'
      currentTitle.style.maxWidth = '100%'
      currentTitle.style.fontSize = `${currentSize}rem`
      currentTitle.style.lineHeight = '1.15'
      const limit = currentContainer.clientWidth
      if (!limit) return
      let guard = 0
      while (currentTitle.scrollWidth > limit && currentSize > minSize && guard < 40) {
        currentSize -= step
        currentTitle.style.fontSize = `${currentSize}rem`
        guard += 1
      }
    }

    fit()

    let observer: ResizeObserver | null = null
    const canObserve = typeof ResizeObserver !== 'undefined'

    if (canObserve) {
      observer = new ResizeObserver(() => fit())
      observer.observe(containerEl)
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', fit)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('resize', fit)
      }
    }
  }, [displayClubName])

  return (
    <div
      className={clsx(
        'ticket-card group relative flex h-full flex-col transition duration-200',
        'hover:-translate-y-0.5 hover:shadow-xl',
        className
      )}
    >
      <div className="flex flex-1 flex-col bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div ref={titleContainerRef} className="flex w-full flex-col gap-1">
          <Link href={`/clubs/${club.slug}`} className="block w-full">
            <h3
              ref={titleRef}
              className="font-semibold leading-snug tracking-tight text-gray-900 whitespace-nowrap"
              style={{ fontSize: '1.2rem', maxWidth: '100%' }}
            >
              {displayClubName}
            </h3>
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Avatar src={moderatorAvatar} size={104} alt={moderatorName} className="flex-shrink-0 ring-4 ring-white shadow-sm" />
          <div className="min-w-0 text-left">
            <p className="whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.12em] text-primary sm:text-[9px] sm:tracking-[0.2em] md:tracking-[0.28em]">
              {eventTitle || '\u00A0'}
            </p>
            {club.moderator ? (
              <Link
                href={userPath(club.moderator?.username, moderatorName, club.moderator?.slug)}
                className="mt-0.5 text-sm font-semibold text-gray-900 leading-tight line-clamp-2"
              >
                {moderatorName}
              </Link>
            ) : (
              <span className="mt-0.5 text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{moderatorName}</span>
            )}

            <div className="mt-2 border-t border-gray-200 pt-2 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gray-500" aria-hidden />
                  <span>{club.memberCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-gray-500" aria-hidden />
                  <span>{hasCapacity ? Math.max(club.capacity ?? 0, 0) : '—'}</span>
                </div>
              </div>
              {lowStock && (
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-tight text-primary">
                  Son {remaining} bilet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="-mx-4 -mt-1 flex items-center px-4 sm:-mx-5 sm:px-5" aria-hidden="true">
        <div className="flex w-full flex-nowrap items-center justify-between gap-x-[0.5px] overflow-hidden">
          {[...Array(32)].map((_, idx) => (
            <span key={idx} className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white" />
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-2 sm:px-5 sm:pb-4 sm:pt-3">
        <div>
          {isSoldOut ? (
            <span className="inline-flex h-8 min-w-[88px] items-center justify-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700">
              Tükendi
            </span>
          ) : (
            <Link
              href={`/clubs/${club.slug}#subscribe`}
              className="inline-flex h-8 min-w-[88px] items-center justify-center rounded-full border border-white bg-white px-3 text-xs font-semibold text-primary transition hover:bg-white/90"
            >
              Abone ol
            </Link>
          )}
        </div>

        <div className="text-right text-base font-semibold text-white sm:text-lg">₺{club.priceTRY}</div>
      </div>
    </div>
  )
}
