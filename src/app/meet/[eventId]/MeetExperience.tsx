'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import LiveClient from './LiveClient'

type Props = {
  eventId: string
  isModerator: boolean
  clubSlug: string
  eventTitle: string
  clubName: string
  moderatorName?: string | null
  moderatorAvatar?: string | null
}

const HIDE_DELAY = 4000

export default function MeetExperience({ eventId, isModerator, clubSlug, eventTitle, clubName, moderatorName, moderatorAvatar }: Props) {
  const [isMobile, setIsMobile] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const hideTimer = useRef<NodeJS.Timeout | null>(null)
  const clubLabel = useMemo(() => (clubName ? clubName.toLocaleUpperCase('tr-TR') : ''), [clubName])
  const headerSurfaceClass = 'border-b border-white/15 bg-white/5 shadow-2xl backdrop-blur-2xl'

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const media = window.matchMedia('(max-width: 640px)')
    const updateMatch = () => setIsMobile(media.matches)
    updateMatch()
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
    media.addListener(listener)
    return () => media.removeListener(listener)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const scheduleHide = useCallback(
    (delay = HIDE_DELAY) => {
      if (isMobile) return
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setHeaderVisible(false), delay)
    },
    [isMobile]
  )

  const handlePointerActivity = useCallback(() => {
    if (isMobile) return
    setHeaderVisible(true)
    scheduleHide()
  }, [isMobile, scheduleHide])

  const handleDesktopIndicatorClick = useCallback(() => {
    handlePointerActivity()
  }, [handlePointerActivity])

  useEffect(() => {
    if (isMobile) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
      setHeaderVisible(false)
      return
    }
    setHeaderVisible(true)
    scheduleHide()
  }, [isMobile, scheduleHide])

  useEffect(() => {
    if (isMobile) return undefined
    const events: Array<keyof WindowEventMap> = ['mousemove', 'touchstart']
    const listener = () => handlePointerActivity()
    events.forEach((eventName) => window.addEventListener(eventName, listener, { passive: true, capture: true }))
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, listener, { capture: true }))
    }
  }, [isMobile, handlePointerActivity])

  const ArrowStack = ({ className }: { className?: string }) => (
    <span className={clsx('flex flex-col items-center gap-[2px]', className)}>
      {[0, 1].map((index) => (
        <svg key={index} width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L6 5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  )

  const HeaderBody = () => (
    <div className="flex w-full flex-col gap-4 px-4 py-4 text-sm text-white sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-2 lg:px-6 lg:py-[10px] xl:px-8 2xl:px-10">
      <div className="flex flex-1 items-start gap-3 sm:items-center sm:gap-4">
        <img
          src="/logo-fixed.svg"
          alt="Book Love"
          className="h-[5rem] w-auto flex-shrink-0 -ml-2 -mt-1 translate-x-2 drop-shadow-md sm:h-[4rem] sm:translate-x-0"
        />
        <div className="flex flex-1 flex-col gap-1 pr-2 text-left leading-tight sm:gap-1 sm:pr-4">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-white sm:text-base">{clubLabel}</div>
          <div className="text-sm font-medium text-white/80 sm:text-base">{eventTitle}</div>
          {moderatorName && (
            <div className="flex items-center gap-2 text-xs font-medium text-white/70 sm:text-sm">
              {moderatorAvatar && (
                <img src={moderatorAvatar} alt={moderatorName} className="h-7 w-7 rounded-full border border-white/30 object-cover" />
              )}
              <span>{moderatorName}</span>
            </div>
          )}
        </div>
      </div>
      <div className="hidden w-full justify-start sm:flex sm:w-auto sm:items-center sm:justify-end">
        <Link
          href={`/clubs/${encodeURIComponent(clubSlug || '')}`}
          className="inline-flex w-max items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90 sm:px-5 sm:py-2 sm:text-sm"
        >
          ← Kulüp sayfasına git
        </Link>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen w-screen bg-black text-white">
      {!isMobile && (
        <>
          <div
            className={clsx(
              'absolute inset-x-0 top-0 z-30 hidden sm:block transition-all duration-300',
              headerVisible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
            )}
          >
            <div className="h-1 w-full bg-[#fa3d30]" />
            <div className={clsx('origin-top transition-all duration-300', headerSurfaceClass)}>
              <HeaderBody />
            </div>
          </div>
          {!headerVisible && (
            <>
              <div className="pointer-events-none fixed inset-x-0 top-0 z-20 hidden h-[3px] bg-[#fa3d30] sm:block" aria-hidden="true" />
              <button
                type="button"
                aria-label="Başlığı aç"
                onClick={handleDesktopIndicatorClick}
                className="fixed left-1/2 top-[3px] z-30 hidden -translate-x-1/2 items-center justify-center rounded-b-full bg-white/10 px-4 py-1 text-white shadow-lg backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:inline-flex"
              >
                <ArrowStack />
              </button>
            </>
          )}
        </>
      )}
      <div className="h-screen w-screen">
        <LiveClient eventId={eventId} isModerator={isModerator} />
      </div>
    </div>
  )
}

