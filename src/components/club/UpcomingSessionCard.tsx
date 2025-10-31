// src/components/club/UpcomingSessionCard.tsx
'use client'

import type { ReactNode } from 'react'
import { formatDateTimeTR } from '@/lib/formatDateTimeTR'

function formatRelativeTR(iso: string) {
  try {
    const target = new Date(iso)
    const now = new Date()
    const diffMs = target.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (24 * 3600 * 1000))
    if (Math.abs(diffDays) > 30) return ''
    if (diffDays > 0) return `${diffDays} gün kaldı`
    if (diffDays < 0) return `${Math.abs(diffDays)} gün önceydi`
    return 'Bugün'
  } catch {
    return ''
  }
}

const fallbackCover =
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=700&auto=format&fit=crop'

type BookInfo = {
  title: string
  author: string | null
  translator: string | null
  pages: number | null
  isbn: string | null
  coverUrl: string | null
  note: string | null
}

export default function EventOverviewCard({
  title,
  notes,
  startsAt,
  status,
  memberCount,
  capacity,
  book,
  children,
}: {
  title: string
  notes: string | null
  startsAt: string
  status: 'upcoming' | 'past'
  memberCount: number
  capacity: number | null
  book: BookInfo
  children?: ReactNode
}) {
  const relative = formatRelativeTR(startsAt)
  const cover = book.coverUrl && book.coverUrl.trim().length > 0 ? book.coverUrl : fallbackCover

  const infoLines = [
    book.author?.trim() || null,
    book.translator ? `Çvr. ${book.translator}` : null,
    book.isbn?.trim() || null,
    typeof book.pages === 'number' && book.pages > 0 ? `${book.pages} sayfa` : null,
  ].filter(Boolean) as string[]

  const statusBadgeClass = 'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]'
  const statusBadgeVariant =
    status === 'upcoming'
      ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200'
      : status === 'past'
        ? 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
        : 'bg-[#fa3d30]/10 text-[#fa3d30] ring-1 ring-inset ring-[#fa3d30]/30'

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
            <p className="text-sm font-medium text-slate-500">{formatDateTimeTR(startsAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end lg:hidden">
            <span className={`${statusBadgeClass} ${statusBadgeVariant}`}>
              {status === 'upcoming' ? 'Yaklaşan Etkinlik' : status === 'past' ? 'Geçmiş Etkinlik' : 'Aktif Etkinlik'}
            </span>
            {relative && (
              <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {relative}
              </span>
            )}
          </div>
        </header>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start lg:gap-8">
          <div className="flex w-full max-w-xl items-start gap-5">
            <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 shadow-sm sm:h-40 sm:w-32 lg:h-44 lg:w-34">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt={book.title || 'Etkinlik kitabı'} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Ayın Seçkisi
              </div>
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">{book.title || 'Belirlenecek Kitap'}</h3>
              {infoLines.length > 0 && (
                <ul className="space-y-1 text-sm text-slate-600">
                  {infoLines.map((line, idx) => (
                    <li key={`${line}-${idx}`} className="truncate">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:flex lg:flex-col lg:items-end lg:gap-4">
            <div className="hidden w-full flex-col items-end gap-2 lg:flex">
              <span className={`${statusBadgeClass} ${statusBadgeVariant}`}>
                {status === 'upcoming' ? 'Yaklaşan Etkinlik' : status === 'past' ? 'Geçmiş Etkinlik' : 'Aktif Etkinlik'}
              </span>
              {relative && (
                <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {relative}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Katılımcı{' '}
                <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-slate-900">{memberCount}</span>
              </span>
              {typeof capacity === 'number' && (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Kontenjan{' '}
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-slate-900">
                    {capacity > 0 ? capacity : 'Sınırsız'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {notes && (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-4 lg:p-6">
            <span className="absolute inset-y-3 left-3 w-[3px] rounded-full bg-[#fa3d30]" aria-hidden="true" />
            <p className="pl-6 text-sm leading-relaxed text-slate-700 lg:text-base">{notes}</p>
          </div>
        )}

        {children && <div className="hidden lg:block lg:pt-2">{children}</div>}
      </div>
    </section>
  )
}
