// src/components/modals/ShareModal.tsx
'use client'

import * as React from 'react'
import PostComposer from '@/components/feed/PostComposer'

export default function ShareModal() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onOpen = () => setOpen(true)
    const onClose = () => setOpen(false)
    window.addEventListener('share:open', onOpen as EventListener)
    window.addEventListener('share:close', onClose as EventListener)
    return () => {
      window.removeEventListener('share:open', onOpen as EventListener)
      window.removeEventListener('share:close', onClose as EventListener)
    }
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="absolute inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-10 sm:top-20 sm:w-[560px] bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">Paylaşım Yap</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-8 w-8 grid place-content-center rounded-full bg-rose-600 text-white hover:bg-rose-700"
            aria-label="Kapat"
            title="Kapat"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <PostComposer onPosted={() => setOpen(false)} />
        </div>
      </div>
    </div>
  )
}
