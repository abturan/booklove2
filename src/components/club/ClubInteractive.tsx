// src/components/club/ClubInteractive.tsx
'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileInfoModal from '@/components/modals/ProfileInfoModal'
import ContractModal from '@/components/modals/ContractModal'
import PaytrIframeModal from '@/components/modals/PaytrIframeModal'
import ClubHeader from './ClubHeader'
import MembersCard from './MembersCard'
import PicksCarousel from './PicksCarousel'
import ChatSection from './ChatSection'
import SubscriptionCard from './SubscriptionCard'
import UpcomingSessionCard from './UpcomingSessionCard'

type Initial = {
  me: {
    id: string | null
    name: string | null
    email: string | null
    avatarUrl: string | null
    city: string | null
    district: string | null
    phone: string | null
  }
  club: {
    id: string
    slug: string
    name: string
    description: string | null
    bannerUrl: string
    priceTRY: number
    moderatorName: string
    moderatorAvatarUrl?: string | null
    moderatorUsername?: string | null
    moderatorSlug?: string | null
    memberCount: number
    isMember: boolean
    memberSince: string | null
    chatRoomId: string | null
    currentPick: { title: string; author: string; translator: string | null; pages: number | null; isbn: string | null; coverUrl: string; note: string | null; monthKey: string } | null
    prevPick: { monthKey: string; title: string; author: string; coverUrl: string } | null
    nextPick: { monthKey: string; title: string; author: string; coverUrl: string } | null
    nextEvent: { title: string; startsAt: string } | null
    members: { id: string; name: string; username?: string | null; slug?: string | null; avatarUrl: string | null }[]
    capacity: number | null
    isSoldOut: boolean
  }
}

type Pending = { merchant_oid: string; iframe_url: string; createdAt: number } | null

export default function ClubInteractive({ initial }: { initial: Initial }) {
  const [isMember, setIsMember] = useState(initial.club.isMember)
  const [memberSince, setMemberSince] = useState<string | null>(initial.club.memberSince)
  const [memberCount, setMemberCount] = useState(initial.club.memberCount)
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
  const [downloadedOnce, setDownloadedOnce] = useState(false)
  const [uiError, setUiError] = useState<string | null>(null)
  const pendingKey = `paytr_pending_${initial.club.id}`
  const [paytrOpen, setPaytrOpen] = useState(false)
  const [paytrUrl, setPaytrUrl] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const search = useSearchParams()

  const membersPreview = useMemo(() => initial.club.members.slice(0, 30), [initial.club.members])

  function readPending(): Pending {
    try {
      const raw = localStorage.getItem(pendingKey)
      if (!raw) return null
      const p = JSON.parse(raw)
      const fresh = Date.now() - (p?.createdAt || 0) < 30 * 60 * 1000
      if (p?.iframe_url && fresh) return p
      localStorage.removeItem(pendingKey)
      return null
    } catch {
      return null
    }
  }
  function clearPending(p?: Pending) {
    try {
      const oid = p?.merchant_oid
      if (oid) sessionStorage.removeItem(`paytr_iframe_${oid}`)
      localStorage.removeItem(pendingKey)
    } catch {}
    setPending(null)
  }
  function resumePending(p: Pending) {
    if (!p?.iframe_url) return
    setPaytrUrl(p.iframe_url)
    setPaytrOpen(true)
    setUiError('Bekleyen abonelik işleminizi tekrar açtık. Ödemeyi tamamlayın veya kapatın.')
  }

  useEffect(() => {
    setPending(readPending())
  }, [])

  useEffect(() => {
    let cancelled = false
    async function refreshMembership(reason: 'payment-ok' | 'not-member') {
      try {
        const res = await fetch(`/api/me/is-member?clubId=${initial.club.id}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.isMember) {
          try {
            const raw = localStorage.getItem(pendingKey)
            if (raw) {
              const p = JSON.parse(raw)
              if (p?.merchant_oid) sessionStorage.removeItem(`paytr_iframe_${p.merchant_oid}`)
            }
            localStorage.removeItem(pendingKey)
          } catch {}
          setIsMember(true)
          setMemberSince(data.memberSince ?? null)
          if (reason === 'payment-ok') setMemberCount((c) => Math.max(c + 1, c))
          setPaytrOpen(false)
          setPaytrUrl(null)
          setUiError(null)
        }
      } catch {}
    }
    const paidOk = search?.get('payment') === 'ok'
    if (paidOk) refreshMembership('payment-ok')
    else if (!isMember) refreshMembership('not-member')
    return () => {
      cancelled = true
    }
  }, [search, initial.club.id, isMember])

  const soldOut = typeof initial.club.capacity === 'number' && initial.club.capacity >= 0 ? memberCount >= (initial.club.capacity ?? 0) : false
  const remaining = typeof initial.club.capacity === 'number' && initial.club.capacity >= 0 ? Math.max((initial.club.capacity ?? 0) - memberCount, 0) : null
  const nearSoldOut = typeof remaining === 'number' && remaining > 0 && remaining <= 10

  const onSubscribe = async () => {
    if (busy) return
    setUiError(null)
    if (soldOut) {
      setUiError('Kontenjan dolu. Bu kulüp şu an yeni abonelik kabul etmiyor.')
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
    const existing = readPending()
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
          userName: initial.me.name || 'Abone',
          userAddress: `${profile.district || ''} ${profile.city || 'Türkiye'}`.trim(),
          userPhone: profile.phone || '0000000000',
          amount: initial.club.priceTRY,
          clubId: initial.club.id,
          clubName: initial.club.name,
          redirectSlug: `clubs/${initial.club.slug}`,
        }),
      })
      const ctype = res.headers.get('content-type') || ''
      if (!ctype.includes('application/json')) {
        throw new Error('Bekleyen abonelik işleminiz olabilir. Mevcut ödemeyi tamamlayın veya 30 dk sonra yeniden deneyin.')
      }
      const data = await res.json()
      if (!res.ok || !data?.iframe_url) throw new Error(data?.error || 'Ödeme başlatılamadı')

      try {
        const p: Pending = { merchant_oid: data.merchant_oid, iframe_url: data.iframe_url, createdAt: Date.now() }
        localStorage.setItem(pendingKey, JSON.stringify(p))
        setPending(p)
      } catch {}
      setPaytrUrl(data.iframe_url)
      setPaytrOpen(true)
    } catch (e: any) {
      setUiError(e?.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="space-y-6 min-w-0">
        <ClubHeader
          moderatorName={initial.club.moderatorName}
          moderatorAvatarUrl={initial.club.moderatorAvatarUrl}
          moderatorUsername={initial.club.moderatorUsername}
          moderatorSlug={initial.club.moderatorSlug}
          clubName={initial.club.name}
          description={initial.club.description}
        />

        <PicksCarousel slug={initial.club.slug} current={initial.club.currentPick} prev={initial.club.prevPick} next={initial.club.nextPick} />

        <MembersCard members={membersPreview} total={memberCount} />

        <ChatSection enabled={isMember} clubId={initial.club.id} isMember={isMember} />
      </div>

      <aside className="space-y-4 min-w-0">
        <SubscriptionCard
          priceTRY={initial.club.priceTRY}
          isMember={isMember}
          memberSince={memberSince}
          soldOut={soldOut}
          capacity={initial.club.capacity}
          nearSoldOut={nearSoldOut}
          remaining={remaining}
          busy={busy}
          uiError={uiError}
          pending={pending}
          onSubscribe={onSubscribe}
          onResumePending={resumePending}
          onClearPending={clearPending}
          profileMissing={profileMissing}
          contractChecked={contractChecked}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenContract={() => setShowContract(true)}
        />

        <UpcomingSessionCard
          nextEventISO={initial.club.nextEvent ? initial.club.nextEvent.startsAt : null}
          memberCount={memberCount}
          capacity={initial.club.capacity}
        />
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
        onDownloaded={() => setDownloadedOnce(true)}
        data={{
          buyerName: initial.me.name || '',
          buyerEmail: initial.me.email || '',
          buyerPhone: profile.phone,
          city: profile.city,
          district: profile.district,
          priceTRY: initial.club.priceTRY,
          startDateISO: new Date().toISOString(),
          ...( { clubId: initial.club.id } as any )
        }}
      />

      <PaytrIframeModal open={paytrOpen} onClose={() => setPaytrOpen(false)} iframeUrl={paytrUrl} title="Güvenli Ödeme — PayTR" />
    </div>
  )
}
