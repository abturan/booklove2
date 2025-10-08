// src/components/modals/ManifestoModal.tsx
'use client'

import { useEffect } from 'react'
import ManifestoContent from '@/components/legal/ManifestoContent'

export default function ManifestoModal({
  open,
  onClose,
  title = 'Manifesto',
}: {
  open: boolean
  onClose: () => void
  title?: string
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <button
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      {/* modal */}
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full w-8 h-8 grid place-items-center hover:bg-neutral-100"
              aria-label="Kapat"
            >
              ×
            </button>
          </div>
          <div className="p-5 md:p-6">
            <ManifestoContent />
          </div>
        </div>
      </div>
    </div>
  )
}
