// src/components/club/ClubInteractive.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import ChatPanel from '@/components/ChatPanel'
import ProfileInfoModal from '@/components/modals/ProfileInfoModal'
import ContractModal from '@/components/modals/ContractModal'
import PaytrIframeModal from '@/components/modals/PaytrIframeModal'
import Avatar from '@/components/Avatar'
import { userPath } from '@/lib/userPath'

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
    memberCount: number
    isMember: boolean
    memberSince: string | null
    chatRoomId: string | null
    currentPick: { title: string; author: string; coverUrl: string } | null
    nextEvent: { title: string; startsAt: string } | null
    members: { id: string; name: string; avatarUrl: string }[]
  }
}

function formatDateTR(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return ''
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
  const errorRef = useRef<HTMLDivElement | null>(null)
  const showError = (msg: string) => {
    setUiError(msg)
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const membersPreview = useMemo(() => initial.club.members.slice(0, 30), [initial.club.members])
  const needContractUI = !!initial.me.id && !isMember

  const [paytrOpen, setPaytrOpen] = useState(false)
  const [paytrUrl, setPaytrUrl] = useState<string | null>(null)
  const pendingKey = `paytr_pending_${initial.club.id}`
  const [pending, setPending] = useState<Pending>(null)

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
    showError('Bekleyen abonelik işleminizi tekrar açtık. Ödemeyi tamamlayın veya kapatın.')
  }
  useEffect(() => {
    setPending(readPending())
  }, [])

  const onSubscribe = async () => {
    if (busy) return
    setUiError(null)

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
      showError('Lütfen Mesafeli Satış Sözleşmesini okuyup onay kutucuğunu işaretleyin.')
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
        throw new Error(
          'Bekleyen abonelik işleminiz olabilir. Mevcut ödemeyi tamamlayın veya 30 dk sonra yeniden deneyin.',
        )
      }
      const data = await res.json()
      if (!res.ok || !data?.iframe_url) throw new Error(data?.error || 'Ödeme başlatılamadı')

      try {
        const p: Pending = {
          merchant_oid: data.merchant_oid,
          iframe_url: data.iframe_url,
          createdAt: Date.now(),
        }
        localStorage.setItem(pendingKey, JSON.stringify(p))
        setPending(p)
      } catch {}

      setPaytrUrl(data.iframe_url)
      setPaytrOpen(true)
    } catch (e: any) {
      showError(e?.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-600">Moderatör</div>
          <div className="mt-1 flex items-center gap-3">
            {initial.club.moderatorAvatarUrl ? (
              <Link href={userPath(undefined, initial.club.moderatorName)} className="inline-block">
                <Avatar src={initial.club.moderatorAvatarUrl} size={80} alt={initial.club.moderatorName} className="ring-2 ring-white shadow" />
              </Link>
            ) : (
              <span className="inline-grid place-items-center w-20 h-20 rounded-full bg-gray-100 text-gray-500 ring-2 ring-white shadow">
                <span className="text-sm">👤</span>
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-semibold">
              {initial.club.moderatorName} — {initial.club.name}
            </h1>
          </div>
          {initial.club.description && (
            <p className="mt-2 text-gray-700">{initial.club.description}</p>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Üyeler</div>
            <div className="text-sm text-gray-600">Toplam: {memberCount}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {membersPreview.map((m) => (
              <div key={m.id} className="relative group">
                <Link href={userPath(undefined, m.name)} className="block">
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow">
                    <Avatar src={m.avatarUrl} size={36} alt={m.name} />
                  </div>
                </Link>
                <div className="absolute left-1/2 -translate-x-1/2 -top-8 pointer-events-none opacity-0 group-hover:opacity-100 transition text-xs bg-gray-900 text-white px-2 py-1 rounded-xl whitespace-nowrap">
                  {m.name}
                </div>
              </div>
            ))}
            {memberCount > membersPreview.length && (
              <span className="text-xs text-gray-600">
                +{memberCount - membersPreview.length} daha
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="text-sm text-gray-600">Bu ayın seçkisi</div>
            {initial.club.currentPick ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100">
                  <Image
                    src={initial.club.currentPick.coverUrl}
                    alt={initial.club.currentPick.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">{initial.club.currentPick.title}</div>
                  <div className="text-sm text-gray-600">{initial.club.currentPick.author}</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-gray-600 text-sm">Kayıt yok</div>
            )}
          </div>
          <div className="card p-4">
            <div className="text-sm text-gray-600">Yaklaşan oturum</div>
            {initial.club.nextEvent ? (
              <div className="mt-2">{formatDateTR(initial.club.nextEvent.startsAt)}</div>
            ) : (
              <div className="mt-2 text-gray-600 text-sm">Planlanmadı</div>
            )}
            <div className="mt-2 text-sm text-gray-600">Üye sayısı: {memberCount}</div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-4 pt-4">
            <div className="font-medium">Sohbet</div>
          </div>
          <div className="p-4 pt-2">
            <ChatPanel enabled={isMember} clubId={initial.club.id} />
          </div>
          {!isMember && (
            <div className="px-4 pb-4 text-xs text-gray-600">
              Yalnızca aboneler mesaj görebilir ve yazabilir. Birini <code>@isim</code> ile
              etiketlediğinde bildirim oluşturulur.
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <div className="text-sm text-gray-600">Abonelik</div>
          <div className="text-3xl font-semibold">₺{initial.club.priceTRY}</div>

          {!isMember ? (
            <>
              {pending && !busy && (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Bekleyen abonelik işleminiz var.
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => resumePending(pending)}
                      className="rounded-full bg-amber-600 text-white px-3 py-1.5 text-sm hover:bg-amber-700"
                    >
                      Devam et
                    </button>
                    <button
                      type="button"
                      onClick={() => clearPending(pending)}
                      className="rounded-full bg-white text-amber-900 border border-amber-300 px-3 py-1.5 text-sm hover:bg-amber-100"
                    >
                      İptal et
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-amber-800">
                    30 dk içinde tamamlanmayan işlemler otomatik olarak sıfırlanır.
                  </div>
                </div>
              )}

              <button
                onClick={onSubscribe}
                disabled={busy}
                className="mt-4 w-full rounded-full h-11 bg-rose-600 text-white font-medium hover:bg-rose-700 transition disabled:opacity-60"
              >
                {busy ? 'Abone olunuyor…' : `Abone ol (₺${initial.club.priceTRY})`}
              </button>

              {profileMissing && (
                <div className="mt-3 text-sm text-amber-900 bg-amber-50 rounded-xl p-3">
                  Eksik bilgiler var, lütfen doldurun.{' '}
                  <button
                    className="underline font-medium"
                    onClick={() => setShowProfileModal(true)}
                    aria-label="Profil bilgisi modalını aç"
                  >
                    Bilgileri tamamla
                  </button>
                </div>
              )}

              {!profileMissing && needContractUI && (
                <div className="mt-4 space-y-2">
                  <label className="inline-flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={contractChecked}
                      onChange={(e) => setContractChecked(e.target.checked)}
                    />
                    <span>
                      <button
                        type="button"
                        className="underline font-medium"
                        onClick={() => setShowContract(true)}
                      >
                        Mesafeli Satış Sözleşmesi
                      </button>
                      ’ni okudum ve kabul ediyorum.
                    </span>
                  </label>
                  {!downloadedOnce && (
                    <div className="text-xs text-gray-500">
                      Not: Linke tıklayın; sözleşme penceresinde en alta indiğinizde “PDF indir”
                      aktif olacaktır.
                    </div>
                  )}
                </div>
              )}

              {uiError && (
                <div
                  ref={errorRef}
                  className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3"
                >
                  {uiError}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 rounded-2xl bg-emerald-50 text-emerald-900 p-4 text-sm">
              <div className="font-medium mb-1">Abonesiniz</div>
              {memberSince && <div>Şu tarihten beri: {formatDateTR(memberSince)}</div>}
            </div>
          )}
        </div>
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

      <PaytrIframeModal
        open={paytrOpen}
        onClose={() => setPaytrOpen(false)}
        iframeUrl={paytrUrl}
        title="Güvenli Ödeme — PayTR"
      />
    </div>
  )
}
