// src/components/ui/modal.tsx
'use client'

import { useEffect, useCallback } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onKey])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div className="relative z-[1001] w-[min(90vw,720px)] max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
