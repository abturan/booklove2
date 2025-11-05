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
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-[min(90vw,420px)]',
  md: 'w-[min(90vw,720px)]',
  lg: 'w-[min(94vw,900px)]',
  xl: 'w-[min(96vw,1120px)]',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  className,
  contentClassName,
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
          'relative z-[1001] max-h-[85dvh] overflow-hidden rounded-2xl bg-white shadow-2xl',
          sizeClass[size] ?? sizeClass.md,
          className,
        )}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-gray-500 hover:bg-gray-100" aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className={clsx('px-6 py-5 overflow-y-auto max-h-[70dvh] overscroll-contain', contentClassName)}>
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-black">
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
