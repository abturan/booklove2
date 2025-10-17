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
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Abonelik</div>
        {nearSoldOut && remaining !== null && remaining > 0 && (
          <span className="text-xs rounded-full px-2 py-0.5 border border-amber-500 text-amber-700 bg-amber-50">
            Son {remaining} koltuk
          </span>
        )}
      </div>
      <div className="mt-1 text-3xl font-semibold">₺{priceTRY}</div>

      {!isMember ? (
        <>
          {soldOut ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold tracking-wide bg-black text-white ring-2 ring-amber-400 shadow-sm select-none">
                Tükendi
              </span>
              {typeof capacity === 'number' && <span className="text-xs text-gray-500">Kontenjan: {capacity}</span>}
            </div>
          ) : (
            <>
              {pending && (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Bekleyen abonelik işleminiz var.
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onResumePending(pending)}
                      className="rounded-full bg-amber-600 text-white px-3 py-1.5 text-sm hover:bg-amber-700"
                    >
                      Devam et
                    </button>
                    <button
                      type="button"
                      onClick={() => onClearPending(pending)}
                      className="rounded-full bg-white text-amber-900 border border-amber-300 px-3 py-1.5 text-sm hover:bg-amber-100"
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
                className="mt-4 w-full rounded-full h-11 bg-rose-600 text-white font-medium hover:bg-rose-700 transition disabled:opacity-60"
              >
                {busy ? 'Abone olunuyor…' : `Abone ol (₺${priceTRY})`}
              </button>
            </>
          )}

          {profileMissing && !soldOut && (
            <div className="mt-3 text-sm text-amber-900 bg-amber-50 rounded-xl p-3">
              Eksik bilgiler var, lütfen doldurun.{' '}
              <button className="underline font-medium" onClick={onOpenProfile} aria-label="Profil bilgisi modalını aç">
                Bilgileri tamamla
              </button>
            </div>
          )}

          {!profileMissing && !soldOut && (
            <div className="mt-4 space-y-2">
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
            <div ref={errorRef} className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
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
  )
}
