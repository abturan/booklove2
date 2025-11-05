'use client'

import { useState } from 'react'
import EventParticipantsModal from '@/components/admin/EventParticipantsModal'

type EventItem = {
  id: string
  title: string | null
  startsAt: string
  priceTRY: number | null
  capacity: number | null
  notes: string | null
  activeMembers: number
  activeSubscriptions: number
  bookTitle: string
  bookAuthor: string
  bookTranslator: string
  bookPages: string
  bookIsbn: string
  bookCoverUrl: string
}

type EventState = EventItem & {
  startsAtLocal: string
  priceInput: string
  capacityInput: string
  coverPreview: string
  coverFile: File | null
  saving: boolean
  removing: boolean
  message: string | null
  error: string | null
}

const fallbackCover =
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop'

function toLocalInput(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

function toISOZ(value: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function formatDisplayDate(value: string, fallback?: string) {
  const iso = value || fallback
  if (!iso) return 'Tarih belirlenmedi'
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return 'Tarih belirlenmedi'
  }
}

const formatCountBadge = (label: string, value: number) => `${label}: ${value}`

export default function ClubEventsManager({
  items,
  defaultPrice,
  defaultCapacity,
  clubSlug,
}: {
  items: EventItem[]
  defaultPrice: number | null
  defaultCapacity: number | null
  clubSlug: string
}) {
  const [events, setEvents] = useState<EventState[]>(
    items.map((event) => ({
      ...event,
      startsAtLocal: toLocalInput(event.startsAt),
      priceInput:
        event.priceTRY !== null && event.priceTRY !== undefined ? String(event.priceTRY) : '',
      capacityInput:
        event.capacity !== null && event.capacity !== undefined ? String(event.capacity) : '',
      coverPreview: event.bookCoverUrl || fallbackCover,
      coverFile: null,
      saving: false,
      removing: false,
      message: null,
      error: null,
    })),
  )

  const updateEventState = (
    id: string,
    patch: Partial<EventState> | ((prev: EventState) => EventState),
  ) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev
        if (typeof patch === 'function') return patch(ev)
        return { ...ev, ...patch }
      }),
    )
  }

  const handleCoverFile = (eventId: string, file: File | null) => {
    if (!file) {
      updateEventState(eventId, (prev) => ({
        ...prev,
        coverFile: null,
        coverPreview: prev.bookCoverUrl || fallbackCover,
      }))
      return
    }
    const preview = URL.createObjectURL(file)
    updateEventState(eventId, {
      coverFile: file,
      coverPreview: preview,
    })
  }

  const uploadCoverIfNeeded = async (state: EventState) => {
    if (!state.coverFile) return state.bookCoverUrl.trim() || null

    const fd = new FormData()
    fd.append('file', state.coverFile)
    const res = await fetch('/api/upload?scope=bookCover', { method: 'POST', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error((data as any)?.error || 'Kapak yüklenemedi.')
    }
    return ((data as any)?.url as string) ?? null
  }

  const handleSave = async (eventId: string) => {
    const state = events.find((ev) => ev.id === eventId)
    if (!state) return
    if (state.removing) return
    if (!state.bookTitle.trim()) {
      updateEventState(eventId, { error: 'Kitap adı zorunlu.', message: null })
      return
    }

    updateEventState(eventId, { saving: true, message: null, error: null })

    let coverUrl: string | null = null
    try {
      coverUrl = await uploadCoverIfNeeded(state)
    } catch (err: any) {
      updateEventState(eventId, {
        saving: false,
        error: err?.message || 'Kapak yüklenemedi.',
        message: null,
      })
      return
    }

    const priceRaw = state.priceInput.trim()
    const priceValue =
      priceRaw === ''
        ? null
        : Number(priceRaw.replace(',', '.').replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, ''))
    const capacityRaw = state.capacityInput.trim()
    const capacityValue =
      capacityRaw === '' ? null : Number(capacityRaw.replace(/[^0-9]/g, ''))
    const pagesRaw = state.bookPages.trim()
    const pagesValue = pagesRaw === '' ? null : Number(pagesRaw.replace(/[^0-9]/g, ''))

    if (priceValue !== null && Number.isNaN(priceValue)) {
      updateEventState(eventId, {
        saving: false,
        error: 'Geçerli bir etkinlik ücreti girin.',
        message: null,
      })
      return
    }

    if (capacityValue !== null && (!Number.isInteger(capacityValue) || capacityValue < 0)) {
      updateEventState(eventId, {
        saving: false,
        error: 'Kapasite 0 veya pozitif tam sayı olmalı.',
        message: null,
      })
      return
    }

    if (pagesValue !== null && (Number.isNaN(pagesValue) || pagesValue <= 0)) {
      updateEventState(eventId, {
        saving: false,
        error: 'Sayfa sayısı pozitif bir sayı olmalı.',
        message: null,
      })
      return
    }

    const payload: Record<string, unknown> = {}
    const startsAtISO = toISOZ(state.startsAtLocal)
    if (startsAtISO) payload.startsAt = startsAtISO
    if (state.title !== null) payload.title = state.title
    payload.notes = state.notes?.trim() ? state.notes : null

    payload.priceTRY = priceValue
    payload.capacity = capacityValue

    payload.book = {
      title: state.bookTitle.trim(),
      author: state.bookAuthor.trim() || null,
      translator: state.bookTranslator.trim() || null,
      pages: pagesValue,
      isbn: state.bookIsbn.trim() || null,
      coverUrl,
    }

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error((data as any)?.error || 'Güncellenemedi.')
      }

      if (state.coverFile && state.coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(state.coverPreview)
      }

      updateEventState(eventId, (prev) => ({
        ...prev,
        saving: false,
        error: null,
        message: 'Kaydedildi.',
        coverFile: null,
        coverPreview: coverUrl || fallbackCover,
        bookCoverUrl: coverUrl || '',
      }))
    } catch (err: any) {
      updateEventState(eventId, {
        saving: false,
        error: err?.message || 'Beklenmeyen bir hata oluştu.',
        message: null,
      })
    }
  }

  const handleDelete = async (eventId: string) => {
    const state = events.find((ev) => ev.id === eventId)
    if (!state || state.saving || state.removing) return

    const warningLines = [
      'Bu etkinliği silmek istediğinizden emin misiniz?',
      state.activeMembers > 0 ? `• ${state.activeMembers} aktif üye kaydı silinecek.` : '',
      state.activeSubscriptions > 0 ? `• ${state.activeSubscriptions} aktif abonelik iptal edilecek.` : '',
    ].filter(Boolean)
    const confirmed = typeof window !== 'undefined' ? window.confirm(warningLines.join('\n')) : false
    if (!confirmed) return

    updateEventState(eventId, { removing: true, error: null, message: null })

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as any)?.error || 'Silinemedi.')
      }

      setEvents((prev) => {
        const next = prev.filter((ev) => ev.id !== eventId)
        if (state.coverFile && state.coverPreview.startsWith('blob:')) {
          URL.revokeObjectURL(state.coverPreview)
        }
        return next
      })
    } catch (err: any) {
      updateEventState(eventId, {
        removing: false,
        error: err?.message || 'Etkinlik silinemedi.',
        message: null,
      })
    }
  }

  const [modalEvent, setModalEvent] = useState<{ id: string; title: string; startsAt: string } | null>(null)

  return (
    <>
      <div className="space-y-10">
        {events.map((event) => {
          const displayDate = formatDisplayDate(event.startsAtLocal, event.startsAt)
          const isUpcoming = new Date(event.startsAt).getTime() >= Date.now()

          return (
          <section
            key={event.id}
            className="overflow-hidden rounded-[32px] bg-white shadow-xl ring-1 ring-black/5"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-white" />
              <div className="relative flex flex-col gap-8 p-6 lg:p-12">
                <header className="flex flex-wrap items-start justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                      {isUpcoming ? 'Yaklaşan Oturum' : 'Geçmiş Oturum'}
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {event.title?.trim() || 'Aylık Oturum'}
                    </div>
                    <div className="text-sm text-gray-500">{displayDate}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-xs font-medium text-slate-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {formatCountBadge('Aktif üye', event.activeMembers)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-xs font-medium text-slate-800">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {formatCountBadge('Aktif abonelik', event.activeSubscriptions)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalEvent({ id: event.id, title: event.title?.trim() || 'Aylık Oturum', startsAt: event.startsAt })}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Katılımcılar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      disabled={event.removing || event.saving}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {event.removing ? 'Siliniyor…' : 'Etkinliği Sil'}
                    </button>
                  </div>
                </header>

                <div className="grid gap-10 lg:grid-cols-[320px,1fr]">
                  <aside className="group relative flex h-full flex-col justify-end overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
                    <div className="absolute inset-0 opacity-60 transition group-hover:opacity-70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.coverPreview || fallbackCover}
                        alt={event.bookTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="relative flex flex-col gap-2 p-6">
                      <span className="inline-flex w-max items-center rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70">
                        Kitap bilgisi
                      </span>
                      <h3 className="text-xl font-semibold leading-tight">
                        {event.bookTitle || 'Kitap adı henüz belirlenmedi'}
                      </h3>
                      {event.bookAuthor && (
                        <p className="text-sm text-white/80">
                          {event.bookAuthor}
                          {event.bookTranslator ? ` · Çeviri: ${event.bookTranslator}` : ''}
                        </p>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/70">
                        <div>
                          <div className="text-white/50">ISBN</div>
                          <div>{event.bookIsbn || '—'}</div>
                        </div>
                        <div>
                          <div className="text-white/50">Sayfa</div>
                          <div>{event.bookPages || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </aside>

                  <div className="space-y-8">
                    <fieldset className="space-y-4 rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
                      <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Zaman &amp; Oturum
                      </legend>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Tarih &amp; saat</span>
                          <input
                            type="datetime-local"
                            value={event.startsAtLocal}
                            onChange={(e) =>
                              updateEventState(event.id, { startsAtLocal: e.target.value })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Oturum başlığı</span>
                          <input
                            value={event.title ?? ''}
                            onChange={(e) => updateEventState(event.id, { title: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="Aylık Oturum"
                          />
                        </label>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Etkinlik ücreti (₺)</span>
                          <div className="relative">
                            <input
                              value={event.priceInput}
                              onChange={(e) =>
                                updateEventState(event.id, {
                                  priceInput: e.target.value.replace(/[^0-9.,]/g, ''),
                                })
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                              placeholder={
                                defaultPrice != null
                                  ? `Varsayılan ₺${defaultPrice?.toLocaleString('tr-TR')}`
                                  : 'Örn. 149'
                              }
                            />
                          </div>
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Kapasite</span>
                          <input
                            value={event.capacityInput}
                            onChange={(e) =>
                              updateEventState(event.id, {
                                capacityInput: e.target.value.replace(/[^0-9]/g, ''),
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder={
                              defaultCapacity != null
                                ? defaultCapacity > 0
                                  ? `Varsayılan ${defaultCapacity} kişi`
                                  : 'Sınırsız'
                                : 'Örn. 50'
                            }
                          />
                        </label>
                      </div>
                    </fieldset>

                    <fieldset className="space-y-5 rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
                      <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Kitap Detayları
                      </legend>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Kitap adı *</span>
                          <input
                            value={event.bookTitle}
                            onChange={(e) =>
                              updateEventState(event.id, { bookTitle: e.target.value })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="Örn. Ay Işığı"
                          />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Yazar</span>
                          <input
                            value={event.bookAuthor}
                            onChange={(e) =>
                              updateEventState(event.id, { bookAuthor: e.target.value })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="Yazar adı"
                          />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Çevirmen</span>
                          <input
                            value={event.bookTranslator}
                            onChange={(e) =>
                              updateEventState(event.id, { bookTranslator: e.target.value })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="—"
                          />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>Sayfa sayısı</span>
                          <input
                            value={event.bookPages}
                            onChange={(e) =>
                              updateEventState(event.id, {
                                bookPages: e.target.value.replace(/[^0-9]/g, ''),
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            inputMode="numeric"
                            placeholder="Örn. 320"
                          />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-600">
                          <span>ISBN</span>
                          <input
                            value={event.bookIsbn}
                            onChange={(e) =>
                              updateEventState(event.id, { bookIsbn: e.target.value })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="978-…"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-slate-600">
                            Kitap kapağı yükle
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="relative inline-flex cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800">
                              <input
                                type="file"
                                accept="image/png,image/jpeg"
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                onChange={(e) =>
                                  handleCoverFile(event.id, e.target.files?.[0] ?? null)
                                }
                              />
                              Dosya seç
                            </label>
                            {event.coverFile && (
                              <span className="text-xs text-slate-500">
                                {event.coverFile.name}
                              </span>
                            )}
                            {event.coverFile && (
                              <button
                                type="button"
                                onClick={() => handleCoverFile(event.id, null)}
                                className="text-xs font-medium text-rose-600 hover:text-rose-700"
                              >
                                Kaldır
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            PNG veya JPG, en fazla 2 MB. Kaydettiğinizde otomatik yüklenir.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-600">
                            Kapak URL
                          </label>
                          <input
                            value={event.bookCoverUrl}
                            onChange={(e) =>
                              updateEventState(event.id, (prev) => {
                                const value = e.target.value
                                return {
                                  ...prev,
                                  bookCoverUrl: value,
                                  coverPreview: prev.coverFile
                                    ? prev.coverPreview
                                    : value.trim()
                                    ? value.trim()
                                    : fallbackCover,
                                }
                              })
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="https://…"
                          />
                        </div>
                      </div>

                      <label className="block space-y-2 text-sm font-medium text-slate-600">
                        <span>Not</span>
                        <textarea
                          rows={4}
                          value={event.notes ?? ''}
                          onChange={(e) => updateEventState(event.id, { notes: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          placeholder="Etkinlik notları, hazırlık içeriği, buluşma linki…"
                        />
                      </label>
                    </fieldset>

                    <footer className="flex flex-wrap items-center gap-4">
                      <div className="min-h-[20px] text-sm">
                        {event.error && <span className="text-rose-600">{event.error}</span>}
                        {!event.error && event.message && (
                          <span className="text-emerald-600">{event.message}</span>
                        )}
                      </div>
                      <div className="ml-auto flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateEventState(event.id, (prev) => ({
                              ...prev,
                              message: null,
                              error: null,
                              coverFile: null,
                              coverPreview: prev.bookCoverUrl || fallbackCover,
                            }))
                          }
                          className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          İptal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(event.id)}
                          disabled={event.saving}
                          className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {event.saving ? 'Kaydediliyor…' : 'Kaydet'}
                        </button>
                      </div>
                    </footer>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )
      })}
      </div>

      {modalEvent && (
        <EventParticipantsModal
          eventId={modalEvent.id}
          eventTitle={modalEvent.title}
          startsAt={modalEvent.startsAt}
          clubSlug={clubSlug}
          open
          onClose={() => setModalEvent(null)}
        />
      )}
    </>
  )
}
