// src/components/EmojiPicker.tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

const EMOJIS = [
  '🙂','😀','😁','😂','😅','😉','😊','😍','🤩','😜','😎','😇','🤗','🥳','🙌','🙏',
  '👏','👍','👌','🔥','✨','🎉','❤️','💛','💚','💙','💜','🖤','🤍','📚','✍️','📖'
]

type Props = {
  open: boolean
  onClose: () => void
  onPick: (emoji: string) => void
  anchorRef?: React.RefObject<HTMLElement | HTMLButtonElement | null>
}

export default function EmojiPicker({ open, onClose, onPick, anchorRef }: Props) {
  const [mounted, setMounted] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const [style, setStyle] = React.useState<React.CSSProperties>({})

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (anchorRef?.current && (anchorRef.current as any).contains?.(t)) return
      onClose()
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [open, onClose, anchorRef])

  React.useEffect(() => {
    if (!open) return
    const isMobile = window.matchMedia('(max-width: 640px)').matches
    if (isMobile) {
      setStyle({ position: 'fixed', left: 0, right: 0, bottom: 0 })
      return
    }
    const rect = anchorRef?.current?.getBoundingClientRect()
    const w = 256
    const h = 220
    const margin = 8
    let left = (rect?.right ?? 0) - w
    let top = (rect?.top ?? 0) - h - margin
    if (left < margin) left = margin
    if (top < margin) top = (rect?.bottom ?? margin) + margin
    setStyle({ position: 'fixed', width: w, top, left })
  }, [open, anchorRef])

  if (!open || !mounted) return null

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches

  return createPortal(
    <div className="z-[1000]">
      {/* Backdrop for mobile */}
      {isMobile && <div className="fixed inset-0 bg-black/30" onClick={onClose} />}
      <div
        ref={panelRef}
        style={style}
        className={
          isMobile
            ? 'mx-3 mb-3 rounded-2xl border bg-white p-2 shadow-xl'
            : 'rounded-2xl border bg-white p-2 shadow-xl'
        }
      >
        <div className={isMobile ? 'grid grid-cols-7 gap-1' : 'grid grid-cols-8 gap-1'}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="h-10 w-10 grid place-items-center rounded-md hover:bg-gray-100 text-xl"
              onClick={() => onPick(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

