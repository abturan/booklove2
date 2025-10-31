// src/components/club/SubscriptionCard.tsx
'use client'

import { useRef } from 'react'

function formatDateTR(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return ''
  }
}

type Pending = { merchant_oid: string; iframe_url: string; createdAt: number } | null

export default function SubscriptionCard({
  priceTRY,
  eventTitle,
  eventStartsAt,
  isMember,
  memberSince,
  soldOut,
  capacity,
  nearSoldOut,
  remaining,
  busy,
  uiError,
  pending,
  onSubscribe,
  onResumePending,
  onClearPending,
  profileMissing,
  contractChecked,
  setContractChecked,
  onOpenProfile,
  onOpenContract,
}: {
  priceTRY: number
  eventTitle?: string
  eventStartsAt?: string | null
  isMember: boolean
  memberSince: string | null
  soldOut: boolean
  capacity: number | null
  nearSoldOut: boolean
  remaining: number | null
  busy: boolean
  uiError: string | null
  pending: Pending
  onSubscribe: () => void
  onResumePending: (p: Pending) => void
  onClearPending: (p?: Pending) => void
  profileMissing: boolean
  contractChecked: boolean
  setContractChecked: (v: boolean) => void
  onOpenProfile: () => void
  onOpenContract: () => void
}) {
  const errorRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="flex flex-col gap-4 text-slate-900">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Etkinlik bileti</span>
        {nearSoldOut && remaining !== null && remaining > 0 && (
          <span className="rounded-full border border-amber-500 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            Son {remaining} koltuk
          </span>
        )}
      </div>
      {eventTitle && (
        <div className="space-y-1">
          <div className="text-sm font-semibold">{eventTitle}</div>
          {eventStartsAt && <div className="text-xs text-slate-500">{formatDateTR(eventStartsAt)}</div>}
        </div>
      )}
      <div className="text-3xl font-semibold">₺{priceTRY}</div>

      {!isMember ? (
        <div className="flex flex-col gap-4">
          {soldOut ? (
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 items-center rounded-full bg-black px-4 text-sm font-semibold tracking-wide text-white ring-2 ring-amber-400 shadow-sm select-none">
                Tükendi
              </span>
              {typeof capacity === 'number' && <span className="text-xs text-slate-500">Kontenjan: {capacity}</span>}
            </div>
          ) : (
            <>
              {pending && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Bekleyen bilet işleminiz var.
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onResumePending(pending)}
                      className="rounded-full bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
                    >
                      Devam et
                    </button>
                    <button
                      type="button"
                      onClick={() => onClearPending(pending)}
                      className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100"
                    >
                      İptal et
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-amber-800">30 dk içinde tamamlanmayan işlemler otomatik olarak sıfırlanır.</div>
                </div>
              )}

              <button
                onClick={onSubscribe}
                disabled={busy}
                className="h-11 w-full rounded-full bg-rose-600 font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {busy ? 'Bilet hazırlanıyor…' : `Bilet al (₺${priceTRY})`}
              </button>
            </>
          )}

          {profileMissing && !soldOut && (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Eksik bilgiler var, lütfen doldurun.{' '}
              <button className="underline font-medium" onClick={onOpenProfile} aria-label="Profil bilgisi modalını aç">
                Bilgileri tamamla
              </button>
            </div>
          )}

          {!profileMissing && !soldOut && (
            <div className="space-y-2">
              <label className="inline-flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={contractChecked} onChange={(e) => setContractChecked(e.target.checked)} />
                <span>
                  <button type="button" className="underline font-medium" onClick={onOpenContract}>
                    Mesafeli Satış Sözleşmesi
                  </button>
                  ’ni okudum ve kabul ediyorum.
                </span>
              </label>
            </div>
          )}

          {uiError && (
            <div ref={errorRef} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {uiError}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="mb-1 font-medium">Etkinliğe dahilsiniz</div>
          {memberSince && <div>Katılım: {formatDateTR(memberSince)}</div>}
        </div>
      )}
    </div>
  )
}
