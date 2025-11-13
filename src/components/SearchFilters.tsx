// src/components/SearchFilters.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Input from '@/components/ui/input'
import DesktopBookBuddySearch from '@/components/home/DesktopBookBuddySearch'

type SortKey = 'members_desc' | 'members_asc' | 'created_desc' | 'created_asc'

function useDebounce<T>(value: T, delay = 250) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t) }, [value, delay])
  return v
}

type Props = {
  variant?: 'default' | 'compact'
  className?: string
}

export default function SearchFilters({ variant = 'default', className }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const compact = variant === 'compact'

  const initialQ = params.get('q') ?? ''
  // Default: newest sessions first (created_desc)
  const defaultSort: SortKey = 'created_desc'
  const initialSort = (params.get('sort') as SortKey) || defaultSort
  // 'soldout=1' means: hide sold-out sessions
  const initialHideSoldOut = params.get('soldout') === '1'
  const initialShowPast = params.get('past') === '1'

  const [q, setQ] = useState(initialQ)
  const [sort, setSort] = useState<SortKey>(initialSort)
  const [hideSoldOut, setHideSoldOut] = useState<boolean>(initialHideSoldOut)
  const [showPast, setShowPast] = useState<boolean>(initialShowPast)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const desktopMenuRef = useRef<HTMLDivElement | null>(null)
  const debouncedQ = useDebounce(q, 250)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  useEffect(() => {
    const s = new URLSearchParams(params.toString())
    debouncedQ ? s.set('q', debouncedQ) : s.delete('q')
    // Do not append default sort to URL; only set when different than default
    sort !== defaultSort ? s.set('sort', sort) : s.delete('sort')
    hideSoldOut ? s.set('soldout', '1') : s.delete('soldout')
    showPast ? s.set('past', '1') : s.delete('past')
    router.replace(`${pathname}?${s.toString()}`, { scroll: false })
  }, [debouncedQ, sort, hideSoldOut, showPast]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!menuOpen) return
    const handler = (event: MouseEvent) => {
      if (!desktopMenuRef.current) return
      if (!desktopMenuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escapeHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escapeHandler)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const escapeHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', escapeHandler)
    return () => document.removeEventListener('keydown', escapeHandler)
  }, [mobileMenuOpen])

  useEffect(() => {
    if (isDesktop) setMobileMenuOpen(false)
    else setMenuOpen(false)
  }, [isDesktop])

  const sortLabels: Record<SortKey, string> = {
    created_desc: 'Yeni eklenenler',
    created_asc: 'Tarih (eski → yeni)',
    members_desc: 'Katılımcı sayısı',
    members_asc: 'Katılımcı sayısı (azdan çoğa)',
  }
  const activeSortLabel = sortLabels[sort] ?? 'Sıralama'

  const sortMenuOptions: Array<{ value: SortKey; label: string }> = [
    { value: 'created_desc', label: 'Yeni eklenenler' },
    { value: 'members_desc', label: 'Katılımcı sayısı (çoktan aza)' },
    { value: 'members_asc', label: 'Katılımcı sayısı (azdan çoğa)' },
  ]

  const toggleEntries = [
    { key: 'hide', label: 'Dolu oturumları gizle', value: hideSoldOut, onToggle: () => setHideSoldOut((prev) => !prev) },
    { key: 'past', label: 'Geçmiş oturumları görüntüle', value: showPast, onToggle: () => setShowPast((prev) => !prev) },
  ] as const

  const closeMenus = () => {
    setMenuOpen(false)
    setMobileMenuOpen(false)
  }

  const menuBody = (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sırala</p>
        <div className="mt-1.5 space-y-1">
          {sortMenuOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setSort(opt.value); closeMenus() }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-sm transition ${
                sort === opt.value ? 'bg-rose-50 text-rose-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={sort === opt.value}
            >
              <span>{opt.label}</span>
              {sort === opt.value ? <span className="text-xs">✓</span> : null}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Filtreler</p>
        <div className="mt-1 space-y-1.5">
          {toggleEntries.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => entry.onToggle()}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-left text-gray-700 transition hover:border-rose-200"
              role="switch"
              aria-checked={entry.value}
            >
              <span className="pr-4 leading-snug">{entry.label}</span>
              <span
                className={`h-3.5 w-3.5 rounded border ${entry.value ? 'bg-rose-500 border-rose-500' : 'border-gray-300'}`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  function handleTrigger() {
    if (isDesktop) {
      setMenuOpen((prev) => !prev)
    } else {
      setMobileMenuOpen(true)
    }
  }

  const wrapperClass = clsx(
    'relative',
    compact ? 'w-full' : 'z-40 mb-4 md:mb-6',
    className
  )

  const panelClass = clsx(
    'rounded-2xl backdrop-blur',
    compact
      ? 'rounded-3xl border border-white/40 bg-white/20 px-2 py-1 shadow-lg'
      : 'border border-gray-100 bg-white/70 px-3 py-2 shadow-sm'
  )

  const layoutClass = compact
    ? 'flex w-full items-center gap-2'
    : 'flex flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.58fr)] md:items-center md:gap-8'

  const searchInputClass = compact
    ? 'h-9 rounded-2xl border border-white/60 bg-white/95 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-500 outline-none transition focus:ring-1 focus:ring-[#fa3d30]/30 shadow-sm'
    : 'h-12 rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 focus:border-[#fa3d30] focus:ring-[#fa3d30]/30 md:border-2 md:border-[#fa3d30] md:rounded-r-none md:border-r-0'

  const filterButtonClass = compact
    ? 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-[#fa3d30] shadow-sm transition hover:bg-white'
    : 'inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-none transition hover:bg-gray-50 md:w-14 md:rounded-l-none md:border-2 md:border-[#fa3d30] md:border-l-0 md:text-[#fa3d30] md:hover:bg-[#fa3d30]/5'

  const iconClass = compact
    ? 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#fa3d30]'
    : 'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 md:text-[#fa3d30]'

  return (
    <div className={wrapperClass}>
      <div className={panelClass}>
        <div className={layoutClass} style={compact ? { transform: 'scale(0.93)', transformOrigin: 'center' } : undefined}>
          <div className={compact ? 'flex w-full items-center gap-2' : 'flex w-full items-center gap-2 md:flex-row md:gap-0'}>
            <div className="relative flex-1">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Yazar, kulüp veya moderatör ara…"
                className={searchInputClass}
                aria-label="Ara"
              />
              <svg
                className={iconClass}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-3.6-3.6" />
              </svg>
            </div>

            <div className={clsx('relative flex-shrink-0', !compact && 'md:-ml-[2px]')} ref={desktopMenuRef}>
              <button
                type="button"
                onClick={handleTrigger}
                className={filterButtonClass}
                aria-label="Sırala / filtrele"
                aria-expanded={isDesktop ? menuOpen : mobileMenuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16" />
                  <path d="M7 12h10" />
                  <path d="M10 17h4" />
                </svg>
              </button>
              {isDesktop && menuOpen && (
                <div className={clsx(
                  'absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border bg-white p-4 shadow-xl',
                  compact ? 'border-white/40 bg-white/95 text-gray-900' : 'border-gray-100'
                )}>
                  {menuBody}
                </div>
              )}
            </div>
          </div>

          <DesktopBookBuddySearch className={compact ? 'min-w-[240px]' : 'md:w-full'} variant={variant} />
        </div>
      </div>

      {mobileMenuOpen && !isDesktop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 text-sm text-gray-400 hover:text-gray-600"
              aria-label="Kapat"
            >
              ✕
            </button>
            <div className="mb-4 text-base font-semibold text-gray-900">Sırala / filtrele</div>
            {menuBody}
          </div>
        </div>
      )}
    </div>
  )
}
