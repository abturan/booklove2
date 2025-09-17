// src/components/modals/ModalFrame.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  title?: string
  children: React.ReactNode
  onCloseHref?: string
}

export default function ModalFrame({ title, children, onCloseHref = '/' }: Props) {
  const router = useRouter()

  function close() {
    if (window.history.length > 1) router.back()
    else router.push(onCloseHref)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative mx-auto mt-10 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button aria-label="Kapat" onClick={close} className="rounded-md border px-3 py-1 hover:bg-neutral-50">
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-auto px-6 py-5 text-base  leading-[1.9]">
          {children}
        </div>
      </div>
    </div>
  )
}
