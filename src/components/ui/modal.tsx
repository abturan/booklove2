// src/components/ui/modal.tsx
'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  contentClassName?: string
  showHeader?: boolean
  showFooter?: boolean
  floatingCloseButton?: boolean
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'sm:w-[min(90vw,420px)]',
  md: 'sm:w-[min(90vw,720px)]',
  lg: 'sm:w-[min(94vw,900px)]',
  xl: 'sm:w-[min(96vw,1120px)]',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  className,
  contentClassName,
  showHeader,
  showFooter,
  floatingCloseButton,
}: Props) {
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

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className={clsx(
          'relative z-[1001] max-h-[95dvh] w-full overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-2xl',
          sizeClass[size] ?? sizeClass.md,
          className,
        )}
      >
        {showHeader !== false && (
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <button onClick={onClose} className="rounded-full px-3 py-1 text-gray-500 hover:bg-gray-100" aria-label="Kapat">
              ✕
            </button>
          </div>
        )}
        {showHeader === false && floatingCloseButton !== false && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-[1002] rounded-full bg-white/80 px-3 py-1 text-gray-600 shadow hover:bg-white"
            aria-label="Kapat"
          >
            ✕
          </button>
        )}
        <div className={clsx('px-0 py-0 sm:px-6 sm:py-5 overflow-y-auto max-h-[80dvh] sm:max-h-[70dvh] overscroll-contain', contentClassName)}>
          {children}
        </div>
        {showFooter !== false && (
          <div className="flex justify-end gap-2 border-t px-4 py-3 sm:px-6 sm:py-4">
            <button onClick={onClose} className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black">
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
