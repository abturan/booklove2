// src/components/ui/BareModal.tsx
'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

type Props = {
  open: boolean
  onClose: () => void
  title?: string | null
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  contentClassName?: string
  scrollable?: boolean
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-full sm:w-[min(90vw,420px)]',
  md: 'w-full sm:w-[min(90vw,720px)]',
  lg: 'w-full sm:w-[min(94vw,880px)]',
  xl: 'w-full sm:w-[min(96vw,1040px)]',
}

export default function BareModal({ open, onClose, title, children, size = 'md', className, contentClassName, scrollable = true }: Props) {
  const [mounted, setMounted] = useState(false)

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onKey])

  if (!open || !mounted) return null

  const hasTitle = typeof title === 'string' ? title.trim().length > 0 : !!title

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className={clsx(
          'relative z-[1001] max-h-[95dvh] overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-2xl',
          sizeClass[size] ?? sizeClass.md,
          className
        )}
      >
        {hasTitle ? (
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="text-base font-semibold">{title}</h3>
            <button onClick={onClose} className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100" aria-label="Kapat">
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg bg-white/70 px-2 py-1 text-gray-500 shadow hover:bg-white"
            aria-label="Kapat"
          >
            ✕
          </button>
        )}
        <div
          className={clsx(
            hasTitle ? 'px-0 py-0 sm:px-5 sm:py-4' : 'px-0 py-0 pt-10 sm:px-5 sm:py-4',
            scrollable ? 'overflow-y-auto max-h-[80dvh] sm:max-h-[70dvh] overscroll-contain' : 'overflow-hidden',
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
