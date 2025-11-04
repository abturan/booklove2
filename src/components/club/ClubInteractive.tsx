// src/components/club/ClubInteractive.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MembersModal from './MembersModal'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ClubInitial } from '@/app/clubs/[slug]/_lib/getInitial'
import ProfileInfoModal from '@/components/modals/ProfileInfoModal'
import ContractModal from '@/components/modals/ContractModal'
import PaytrIframeModal from '@/components/modals/PaytrIframeModal'
import Avatar from '@/components/Avatar'
import clsx from 'clsx'
import ClubHeader from './ClubHeader'
import ChatSection from './ChatSection'
import SubscriptionCard from './SubscriptionCard'
import EventOverviewCard from './UpcomingSessionCard'
import EventNavigation from './EventNavigation'
import ChatPanel from '@/components/ChatPanel'
import useOnlineMap from '@/lib/hooks/useOnlineMap'
import MeetingSection from './MeetingSection'

type Pending = { merchant_oid: string; iframe_url: string; createdAt: number } | null

const pendingKeyFor = (eventId: string) => `paytr_pending_${eventId}`

const CHAT_HEADER_HEIGHT = 56
const FOOTER_HEIGHT_VAR = 'var(--mobile-footer-height, 72px)'
const MEETING_FEATURE_ENABLED = (() => {
  const flag = (process.env.NEXT_PUBLIC_LIVEKIT_ENABLED || '0').toString().toLowerCase()
  return flag === '1' || flag === 'true' || flag === 'yes' || flag === 'on'
})()

export default function ClubInteractive({ initial }: { initial: ClubInitial }) {
  const search = useSearchParams()
  const events = initial.club.events
  const defaultEventId = initial.club.activeEventId ?? events[0]?.id ?? null
  const [activeEventId, setActiveEventId] = useState<string | null>(defaultEventId)

  const activeEvent = useMemo(() => {
    if (!activeEventId) return events[0] ?? null
    return events.find((evt) => evt.id === activeEventId) ?? events[0] ?? null
  }, [events, activeEventId])

  const [isMember, setIsMember] = useState<boolean>(() => initial.club.isModerator || !!activeEvent?.isMember)
  const [memberSince, setMemberSince] = useState<string | null>(activeEvent?.memberSince ?? null)
  const [memberCount, setMemberCount] = useState<number>(activeEvent?.memberCount ?? 0)
  const [busy, setBusy] = useState(false)
  const [profileMissing, setProfileMissing] = useState(
    !!initial.me.id && (!initial.me.city || !initial.me.district || !initial.me.phone),
  )
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profile, setProfile] = useState({
    city: initial.me.city ?? '',
    district: initial.me.district ?? '',
    phone: initial.me.phone ?? '',
  })
  const [showContract, setShowContract] = useState(false)
  const [contractChecked, setContractChecked] = useState(false)
  const [uiError, setUiError] = useState<string | null>(null)
  const [paytrOpen, setPaytrOpen] = useState(false)
  const [paytrUrl, setPaytrUrl] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [mobileMembersOpen, setMobileMembersOpen] = useState(false)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [mobileChatExpanded, setMobileChatExpanded] = useState(false)
  const [chatMessageCount, setChatMessageCount] = useState(0)
  const [mobilePanelTab, setMobilePanelTab] = useState<'chat' | 'ticket'>('ticket')
  const [desktopNavOffset, setDesktopNavOffset] = useState(0)
  const chatDragStartY = useRef<number | null>(null)
  const mobileAvatarRowRef = useRef<HTMLDivElement | null>(null)
  const [mobileAvatarLimit, setMobileAvatarLimit] = useState(0)

  const pendingKey = activeEvent ? pendingKeyFor(activeEvent.id) : null

  useEffect(() => {
    if (!activeEvent) return
    setIsMember(initial.club.isModerator || !!activeEvent.isMember)
    setMemberSince(activeEvent.memberSince ?? null)
    setMemberCount(activeEvent.memberCount ?? 0)
    setContractChecked(false)
    setUiError(null)
  }, [activeEvent, initial.club.isModerator])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const prev = document.body.dataset.headerTitle
    document.body.dataset.headerTitle = initial.club.name || ''
    window.dispatchEvent(new Event('header:title'))
    return () => {
      if (prev) document.body.dataset.headerTitle = prev
      else delete document.body.dataset.headerTitle
      window.dispatchEvent(new Event('header:title'))
    }
  }, [initial.club.name])

  const membersPreview = useMemo(
    () => (activeEvent ? activeEvent.members.slice(0, 30) : []),
    [activeEvent],
  )
  const membersPreviewDesktop = useMemo(() => membersPreview.slice(0, 15), [membersPreview])
  const allMembers = activeEvent?.members ?? []
  const onlineMap = useOnlineMap(allMembers.map((m: any) => m.id))

  const readPending = (key: string | null): Pending => {
    if (!key) return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const fresh = Date.now() - (parsed?.createdAt || 0) < 30 * 60 * 1000
      if (parsed?.iframe_url && fresh) return parsed
      localStorage.removeItem(key)
      return null
    } catch {
      return null
    }
  }

  const clearPending = (key: string | null, p?: Pending) => {
    if (!key) return
    try {
      const oid = p?.merchant_oid
      if (oid) sessionStorage.removeItem(`paytr_iframe_${oid}`)
      localStorage.removeItem(key)
    } catch {}
    setPending(null)
  }

  const resumePending = (p: Pending) => {
    if (!p?.iframe_url) return
    setPaytrUrl(p.iframe_url)
    setPaytrOpen(true)
    setUiError('Bekleyen bilet işleminizi tekrar açtık. Ödemeyi tamamlayın veya kapatın.')
  }

  useEffect(() => {
    setPending(readPending(pendingKey))
  }, [pendingKey])

  useEffect(() => {
    setMobileMembersOpen(false)
    setMobileChatOpen(false)
    setMobileChatExpanded(false)
    setMobilePanelTab('ticket')
    setChatMessageCount(0)
    setDesktopNavOffset(0)
  }, [activeEventId])

  useEffect(() => {
    if (!activeEvent) return
    let cancelled = false

    async function refreshMembership(reason: 'payment-ok' | 'check') {
      try {
        const res = await fetch(`/api/me/is-member?eventId=${activeEvent.id}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.isMember) {
          clearPending(pendingKey, readPending(pendingKey))
          setIsMember(true)
          setMemberSince(data.memberSince ?? null)
          if (reason === 'payment-ok') setMemberCount((c) => (typeof c === 'number' ? c + 1 : 1))
          setPaytrOpen(false)
          setPaytrUrl(null)
          setUiError(null)
        }
      } catch {}
    }

    const paidOk = search?.get('payment') === 'ok'
    if (!isMember && !initial.club.isModerator) {
      if (paidOk) refreshMembership('payment-ok')
      else refreshMembership('check')
    }

    return () => {
      cancelled = true
    }
  }, [activeEvent, initial.club.isModerator, isMember, pendingKey, search])

  const capacity = useMemo(() => {
    if (typeof activeEvent?.capacity === 'number') return activeEvent.capacity
    return null
  }, [activeEvent])

  const priceTRY = activeEvent?.priceTRY ?? initial.club.priceTRY
  const soldOut = typeof capacity === 'number' ? memberCount >= capacity : false
  const remaining = typeof capacity === 'number' ? Math.max(capacity - memberCount, 0) : null
  const nearSoldOut = typeof remaining === 'number' && remaining > 0 && remaining <= 10

  const onSubscribe = async () => {
    if (!activeEvent) {
      setUiError('Etkinlik bulunamadı. Lütfen daha sonra tekrar deneyin.')
      return
    }
    if (busy) return
    setUiError(null)
    if (soldOut) {
      setUiError('Kontenjan dolu. Bu etkinlik şu an yeni bilet kabul etmiyor.')
      return
    }
    if (!initial.me.id) {
      const cb = `/clubs/${initial.club.slug}#subscribe`
      window.location.href = `/login?callbackUrl=${encodeURIComponent(cb)}`
      return
    }
    if (profileMissing) {
      setShowProfileModal(true)
      return
    }
    if (!contractChecked) {
      setUiError('Lütfen Mesafeli Satış Sözleşmesini okuyup onay kutucuğunu işaretleyin.')
      return
    }
    const existing = readPending(pendingKey)
    if (existing) {
      setPending(existing)
      resumePending(existing)
      return
    }

    setBusy(true)
      try {
        const res = await fetch('/api/paytr/get-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          email: initial.me.email,
          userName: initial.me.name || 'Katılımcı',
          userAddress: `${profile.district || ''} ${profile.city || 'Türkiye'}`.trim(),
          userPhone: profile.phone || '0000000000',
          amount: priceTRY,
          clubId: initial.club.id,
          clubName: initial.club.name,
          clubEventId: activeEvent.id,
          clubEventTitle: activeEvent.title,
          redirectSlug: `clubs/${initial.club.slug}`,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      })
      const ctype = res.headers.get('content-type') || ''
      const raw = await res.text()
      let data: any = null
      if (ctype.includes('application/json')) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }
      if (!ctype.includes('application/json')) {
        const hint = (raw || '').replace(/\s+/g, ' ').slice(0, 160)
        const reason =
          hint.includes('PayTR') || hint.includes('<html')
            ? `PAYTR servisinden beklenmeyen bir yanıt alındı (örnek: ${hint}...). Lütfen kısa bir süre sonra tekrar deneyin veya başka bir tarayıcı deneyin.`
            : 'Bekleyen bilet işleminiz olabilir. Mevcut ödemeyi tamamlayın veya 30 dk sonra yeniden deneyin.'
        throw new Error(reason)
      }
      if (!res.ok || !data?.iframe_url) {
        if (typeof window !== 'undefined') {
          console.error(
            '[paytr] unexpected response',
            res.status,
            ctype,
            raw.slice(0, 200),
          )
        }
        if (data?.need === 'phone_verify') {
          setShowProfileModal(true)
        }
        throw new Error(data?.error || 'Ödeme başlatılamadı')
      }

      try {
        const payload: Pending = { merchant_oid: data.merchant_oid, iframe_url: data.iframe_url, createdAt: Date.now() }
        if (pendingKey) localStorage.setItem(pendingKey, JSON.stringify(payload))
        setPending(payload)
      } catch {}
      setPaytrUrl(data.iframe_url)
      setPaytrOpen(true)
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : ''
      const friendly =
        msg.includes('Unexpected token') || msg.toLowerCase().includes('<!doctype')
          ? 'PAYTR servisinden beklenmeyen bir yanıt alındı. Lütfen kısa bir süre sonra tekrar deneyin veya başka bir tarayıcı deneyin.'
          : msg || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.'
      setUiError(friendly)
    } finally {
      setBusy(false)
    }
  }

  if (!activeEvent) {
    return <div className="card p-4 text-sm text-gray-600">Bu kulüp için etkinlik bulunamadı.</div>
  }

  const book = activeEvent.pick
    ? {
        title: activeEvent.pick.title,
        author: activeEvent.pick.author,
        translator: activeEvent.pick.translator,
        pages: activeEvent.pick.pages,
        isbn: activeEvent.pick.isbn,
        coverUrl: activeEvent.pick.coverUrl,
        note: activeEvent.pick.note,
      }
    : {
        title: `${activeEvent.title} seçkisi`,
        author: null,
        translator: null,
        pages: null,
        isbn: null,
        coverUrl: null,
        note: null,
      }

  const canPostToChat = initial.club.isModerator || isMember

  const navItems = useMemo(
    () =>
      events.map((evt) => ({
        id: evt.id,
        title: evt.title,
        startsAt: evt.startsAt,
        status: (evt.id === activeEvent?.id ? 'active' : evt.status) as 'active' | 'upcoming' | 'past',
      })),
    [events, activeEvent],
  )

  const ensureDesktopNavRange = useCallback(
    (activeId: string | null, items: typeof navItems, currentOffset: number, windowSize = 2) => {
      if (!activeId) return currentOffset
      const idx = items.findIndex((item) => item.id === activeId)
      if (idx === -1) return currentOffset
      const maxOffset = Math.max(0, items.length - windowSize)
      const desired = Math.min(Math.max(idx - Math.floor(windowSize / 2), 0), maxOffset)
      return desired
    },
    [],
  )

  useEffect(() => {
    setDesktopNavOffset((prev) => ensureDesktopNavRange(activeEvent?.id ?? null, navItems, prev, 2))
  }, [activeEvent?.id, ensureDesktopNavRange, navItems])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = mobileAvatarRowRef.current
    if (!el) {
      setMobileAvatarLimit(0)
      return
    }

    const AVATAR_SIZE = 36
    const GAP = 8

    const computeLimit = () => {
      if (!membersPreview.length) {
        setMobileAvatarLimit(0)
        return
      }
      const width = el.clientWidth
      if (width <= 0) return
      const perRow = Math.max(1, Math.floor((width + GAP) / (AVATAR_SIZE + GAP)))
      setMobileAvatarLimit(Math.min(perRow, membersPreview.length))
    }

    computeLimit()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => computeLimit())
      observer.observe(el)
      return () => observer.disconnect()
    }

    const handle = () => computeLimit()
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [membersPreview.length, activeEvent?.id])

  const activeIndex = navItems.findIndex((item) => item.id === activeEvent?.id)
  const resolvedActiveIndex = activeIndex === -1 ? 0 : activeIndex
  const desktopNavHasPrev = resolvedActiveIndex > 0
  const desktopNavHasNext = resolvedActiveIndex < navItems.length - 1

  const moveActiveBy = (delta: number) => {
    if (!navItems.length) return
    const currentIdx = resolvedActiveIndex
    const nextIdx = Math.min(Math.max(currentIdx + delta, 0), navItems.length - 1)
    if (nextIdx === currentIdx) return
    const target = navItems[nextIdx]
    if (target) {
      setActiveEventId(target.id)
      setDesktopNavOffset((prev) => ensureDesktopNavRange(target.id, navItems, prev, 2))
    }
  }

  const mobileVisibleCount = mobileAvatarLimit > 0 ? mobileAvatarLimit : membersPreview.length
  const mobileVisibleMembers =
    mobileVisibleCount > 0 ? membersPreview.slice(0, mobileVisibleCount) : membersPreview
  const mobileHiddenCount = Math.max(memberCount - mobileVisibleMembers.length, 0)


  useEffect(() => {
    let cancelled = false
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    async function preloadCount() {
      if (!activeEvent?.id) {
        setChatMessageCount(0)
        return
      }
      try {
        const res = await fetch(`/api/chat/events/${activeEvent.id}/messages`, {
          cache: 'no-store',
          signal: controller?.signal,
        })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!cancelled && Array.isArray(data?.items)) {
          setChatMessageCount(data.items.length)
        }
      } catch {}
    }
    preloadCount()
    return () => {
      cancelled = true
      controller?.abort()
    }
  }, [activeEvent?.id])

  const handleChatPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('button')) {
      chatDragStartY.current = null
      return
    }
    chatDragStartY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const openMobilePanel = (tab: 'chat' | 'ticket') => {
    setMobilePanelTab(tab)
    setMobileChatOpen(true)
    setMobileChatExpanded(false)
  }

  const closeMobileChat = () => {
    setMobileChatExpanded(false)
    setMobileChatOpen(false)
    setMobilePanelTab('ticket')
  }

  const handleChatPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (chatDragStartY.current === null) return
    const delta = e.clientY - chatDragStartY.current
    if (delta > 120) {
      chatDragStartY.current = null
      setMobileChatExpanded(false)
      setMobileChatOpen(false)
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    } else if (delta < -120) {
      setMobileChatExpanded(true)
    }
  }

  const handleChatPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('button')) {
      chatDragStartY.current = null
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
      return
    }
    const delta = chatDragStartY.current !== null ? e.clientY - chatDragStartY.current : 0
    chatDragStartY.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (Math.abs(delta) < 10) {
      if (mobileChatOpen && mobileChatExpanded) {
        setMobileChatExpanded(false)
      } else if (mobileChatOpen) {
        closeMobileChat()
      } else {
        openMobilePanel('ticket')
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6 pb-16 lg:pb-0">
        <ClubHeader
          moderatorName={initial.club.moderatorName}
          moderatorAvatarUrl={initial.club.moderatorAvatarUrl}
          moderatorUsername={initial.club.moderatorUsername}
          moderatorSlug={initial.club.moderatorSlug}
          clubName={initial.club.name}
          description={initial.club.description}
        />

        <EventNavigation
          events={navItems}
          activeId={activeEvent?.id ?? null}
          onSelect={setActiveEventId}
          className="lg:hidden"
        />

        {memberCount > 0 && (
          <div className="lg:hidden rounded-[24px] border border-slate-200/70 bg-white px-4 py-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              <div ref={mobileAvatarRowRef} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {mobileVisibleMembers.map((member) => (
                  <Avatar
                    key={`mobile-cloud-${member.id}`}
                    src={member.avatarUrl}
                    size={36}
                    alt={member.name}
                    className="border border-white/70 bg-white shadow-sm"
                    online={!!onlineMap[member.id]}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              {mobileHiddenCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  +{mobileHiddenCount} katılımcı
                </span>
              )}
              <button
                type="button"
                onClick={() => setMobileMembersOpen(true)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border border-[#fa3d30]/40 bg-[#fa3d30]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#fa3d30] transition hover:bg-[#fa3d30]/15',
                  mobileHiddenCount === 0 ? 'ml-auto' : '',
                )}
              >
                Tümünü listele
              </button>
            </div>
          </div>
        )}

          <EventOverviewCard
            title={activeEvent.title}
            notes={activeEvent.notes}
            startsAt={activeEvent.startsAt}
            status={activeEvent.status}
            memberCount={memberCount}
            capacity={capacity}
            book={book}
          >
            {/* Desktop: Meeting + a spacer below it */}
            {MEETING_FEATURE_ENABLED && (
              <div className="hidden lg:block">
              <MeetingSection
                eventId={activeEvent.id}
                eventStartsAt={activeEvent.startsAt}
                isMember={isMember || initial.club.isModerator}
                isModerator={initial.club.isModerator}
                moderatorId={initial.club.moderatorId}
              />
                <div className="h-6" />
              </div>
            )}
            <ChatSection
              enabled={canPostToChat}
              eventId={activeEvent.id}
              isMember={isMember || initial.club.isModerator}
              isModerator={initial.club.isModerator}
              messageCount={chatMessageCount}
              onCountChange={setChatMessageCount}
            />
          </EventOverviewCard>
        </div>

      {/* Mobile: show Meeting section openly below the overview card */}
      {MEETING_FEATURE_ENABLED && (
        <div className="lg:hidden">
          <div className="mt-4" style={{ marginBottom: 'calc(var(--mobile-footer-height, 72px) + 80px)' }}>
          <MeetingSection
            eventId={activeEvent.id}
            eventStartsAt={activeEvent.startsAt}
            isMember={isMember || initial.club.isModerator}
            isModerator={initial.club.isModerator}
            moderatorId={initial.club.moderatorId}
          />
          </div>
        </div>
      )}

      <aside className="hidden space-y-4 lg:block lg:min-w-0">
        <EventNavigation
          events={navItems}
          activeId={activeEvent?.id ?? null}
          onSelect={setActiveEventId}
          mode="vertical"
          className="hidden lg:block"
          headerActions={
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => moveActiveBy(-1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                disabled={!desktopNavHasPrev}
                aria-label="Önceki oturumlar"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveActiveBy(1)}
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
                disabled={!desktopNavHasNext}
                aria-label="Sonraki oturumlar"
              >
                ↓
              </button>
            </div>
          }
          verticalOffset={desktopNavOffset}
          visibleCount={2}
        />

        <div id="club-subscription-card" className="hidden lg:block">
          <div className="overflow-hidden rounded-[28px] border-2 border-dashed border-[#fa3d30]/40 bg-white px-6 py-6 text-slate-900">
            <SubscriptionCard
              priceTRY={priceTRY}
              eventTitle={activeEvent.title}
              eventStartsAt={activeEvent.startsAt}
              isMember={isMember || initial.club.isModerator}
              memberSince={memberSince}
              soldOut={soldOut}
              capacity={capacity}
              nearSoldOut={nearSoldOut}
              remaining={remaining}
              busy={busy}
              uiError={uiError}
              pending={pending}
              onSubscribe={onSubscribe}
              onResumePending={resumePending}
              onClearPending={(p) => clearPending(pendingKey, p)}
              profileMissing={profileMissing}
              contractChecked={contractChecked}
              setContractChecked={setContractChecked}
              onOpenProfile={() => setShowProfileModal(true)}
              onOpenContract={() => setShowContract(true)}
            />
          </div>
        </div>

        {memberCount > 0 && (
          <div className="hidden lg:flex flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Katılımcılar</h3>
              <span className="shrink-0 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Toplam {memberCount}
              </span>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              {membersPreviewDesktop.map((member) => (
                <Avatar
                  key={`desk-strip-${member.id}`}
                  src={member.avatarUrl}
                  size={40}
                  alt={member.name}
                  className="border border-white/70 bg-white shadow-sm"
                  online={!!onlineMap[member.id]}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMobileMembersOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#fa3d30]/40 bg-[#fa3d30]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fa3d30] transition hover:bg-[#fa3d30]/15"
              >
                Tümünü listele
              </button>
            </div>
          </div>
        )}
      </aside>

      <ProfileInfoModal
        open={showProfileModal}
        initial={profile}
        onClose={() => setShowProfileModal(false)}
        onSaved={(v) => {
          setProfile(v)
          setProfileMissing(false)
          setShowProfileModal(false)
          setUiError(null)
        }}
      />

      <ContractModal
        open={showContract}
        onClose={() => setShowContract(false)}
        onDownloaded={() => {}}
        data={{
          buyerName: initial.me.name || '',
          buyerEmail: initial.me.email || '',
          buyerPhone: profile.phone,
          city: profile.city,
          district: profile.district,
          priceTRY,
          startDateISO: new Date().toISOString(),
          clubId: initial.club.id,
        }}
      />

      <PaytrIframeModal open={paytrOpen} onClose={() => setPaytrOpen(false)} iframeUrl={paytrUrl} title="Güvenli Ödeme — PayTR" />

      {activeEvent && (
        <MembersModal
          open={mobileMembersOpen}
          onClose={() => setMobileMembersOpen(false)}
          members={allMembers}
          total={memberCount}
          isAuthenticated={!!initial.me.id}
          clubSlug={initial.club.slug}
        />
      )}

      {activeEvent && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-50 px-4 transition-transform duration-300"
          style={{
            bottom: 'env(safe-area-inset-bottom)',
            transform: mobileChatOpen
              ? `translateY(calc(-1 * (${FOOTER_HEIGHT_VAR})))`
              : `translateY(calc(100% - (${CHAT_HEADER_HEIGHT}px + ${FOOTER_HEIGHT_VAR})))`,
          }}
        >
          <div className="rounded-t-[24px] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15">
            <div
              className="flex items-center justify-between rounded-t-[24px] bg-[#fa3d30] px-4 py-3 text-white"
              onPointerDown={handleChatPointerDown}
              onPointerMove={handleChatPointerMove}
              onPointerUp={handleChatPointerUp}
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="inline-flex rounded-full bg-white/15 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!mobileChatOpen) openMobilePanel('chat')
                      else {
                        setMobilePanelTab('chat')
                        setMobileChatExpanded(false)
                      }
                    }}
                    className={clsx(
                      'flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition',
                      mobilePanelTab === 'chat'
                        ? 'bg-white text-[#fa3d30]'
                        : 'text-white/80 hover:bg-white/10',
                    )}
                  >
                    Sohbet
                    {chatMessageCount > 0 && (
                      <span className="grid h-5 min-w-[20px] place-items-center rounded-full border border-white/70 bg-white px-1 text-[10px] font-semibold leading-none text-[#fa3d30] shadow-[0_0_0_1px_rgba(250,61,48,0.35)]">
                        {Math.min(chatMessageCount, 999)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openMobilePanel('ticket')}
                    className={clsx(
                      'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition',
                      mobilePanelTab === 'ticket'
                        ? 'bg-white text-[#fa3d30]'
                        : 'text-white/80 hover:bg-white/10',
                    )}
                  >
                    Bilet
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (mobileChatOpen) closeMobileChat()
                    else {
                      openMobilePanel('ticket')
                    }
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/45 bg-white/10 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <span aria-hidden="true">{mobileChatOpen ? '✕' : '↑'}</span>
                  <span className="sr-only">{mobileChatOpen ? 'Sohbeti kapat' : 'Sohbeti aç'}</span>
                </button>
              </div>
            </div>
            <div
              className={clsx(
                'flex min-h-[320px] flex-col bg-white px-4 transition-[max-height] duration-300 ease-out',
                mobileChatExpanded ? 'max-h-none' : '',
              )}
              style={{
                paddingBottom: `calc(env(safe-area-inset-bottom) + 0.5rem)`,
                maxHeight: mobileChatExpanded
                  ? `calc(100vh - (${FOOTER_HEIGHT_VAR} + 24px))`
                  : `min(420px, calc(100vh - (${FOOTER_HEIGHT_VAR} + ${CHAT_HEADER_HEIGHT}px + 24px)))`,
              }}
            >
              {mobilePanelTab === 'chat' ? (
                <>
                  <ChatPanel
                    key={activeEvent.id}
                    enabled={canPostToChat}
                    eventId={activeEvent.id}
                    className="flex-1 min-h-0 max-h-none"
                    allowSecret={initial.club.isModerator}
                    canSeeSecret={isMember || initial.club.isModerator}
                    onCountChange={setChatMessageCount}
                  />
                  {!canPostToChat && (
                    <div className="mt-2 px-1 text-xs text-slate-500">
                      Mesaj yazabilmek için etkinlik biletinizi alın.
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 overflow-y-auto pb-4 pt-2">
                  <SubscriptionCard
                    priceTRY={priceTRY}
                    eventTitle={activeEvent.title}
                    eventStartsAt={activeEvent.startsAt}
                    isMember={isMember || initial.club.isModerator}
                    memberSince={memberSince}
                    soldOut={soldOut}
                    capacity={capacity}
                    nearSoldOut={nearSoldOut}
                    remaining={remaining}
                    busy={busy}
                    uiError={uiError}
                    pending={pending}
                    onSubscribe={onSubscribe}
                    onResumePending={resumePending}
                    onClearPending={(p) => clearPending(pendingKey, p)}
                    profileMissing={profileMissing}
                    contractChecked={contractChecked}
                    setContractChecked={setContractChecked}
                    onOpenProfile={() => setShowProfileModal(true)}
                    onOpenContract={() => setShowContract(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
