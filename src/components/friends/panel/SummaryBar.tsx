// src/components/friends/panel/SummaryBar.tsx
'use client'

import Link from 'next/link'

export default function SummaryBar({
  pendingCount,
  unreadDm,
  compact,
  onToggleCompact,
}: {
  pendingCount: number
  unreadDm: number
  compact: boolean
  onToggleCompact: () => void
}) {
  const total = pendingCount + unreadDm

  return (
    <div className="px-5 py-3 border-t bg-transparent border-transparent lg:bg-white lg:border-gray-100">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-900">
          {pendingCount > 0 && (
            <Link href="/friends" className="inline-flex items-center gap-2 font-medium">
              <span className="h-6 w-6 rounded-full bg-primary text-white grid place-content-center">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 17v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="7" r="1.5" fill="currentColor" />
                </svg>
              </span>
              {pendingCount} bekleyen Book Buddy mesaj isteğiniz var
            </Link>
          )}
          {unreadDm > 0 && (
            <Link href="/messages" className="inline-flex items-center gap-2 font-medium">
              <span className="h-6 w-6 rounded-full bg-primary text-white grid place-content-center">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21 15V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4l3 3 3-3h4a2 2 0 0 0 2-2z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {unreadDm} okunmamış mesajınız var
            </Link>
          )}
        </div>

        {total > 0 ? (
          <button
            type="button"
            onClick={onToggleCompact}
            aria-label={compact ? 'Genişlet' : 'Küçült'}
            title={compact ? 'Genişlet' : 'Küçült'}
            className="hidden lg:grid h-11 w-11 place-content-center rounded-full bg-primary text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {compact ? (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>
    </div>
  )
}
