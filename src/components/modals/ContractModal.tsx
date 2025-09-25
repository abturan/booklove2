//src/components/modals/ContractModal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { buildContractHtml, type ContractData } from '@/lib/contract'

type Props = {
  open: boolean
  data: (ContractData & { clubId?: string })
  onClose: () => void
  onDownloaded: () => void
}

export default function ContractModal({ open, data, onClose, onDownloaded }: Props) {
  const [canDownload, setCanDownload] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setCanDownload(false)
    setErr(null)
  }, [open])

  if (!open) return null

  const html = buildContractHtml(data)

  const onScroll = () => {
    const el = bodyRef.current
    if (!el) return
    const reached = el.scrollTop + el.clientHeight >= el.scrollHeight - 8
    if (reached) setCanDownload(true)
  }

  const downloadPdf = async () => {
    setErr(null)
    const res = await fetch('/api/contracts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId: data.clubId }),
    })
    if (!res.ok) {
      setErr('PDF üretimi başarısız. Lütfen tekrar deneyin.')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mesafeli-satis-sozlesmesi.pdf'
    a.click()
    URL.revokeObjectURL(url)
    onDownloaded()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">Mesafeli Satış Sözleşmesi</div>
          <div className="text-xs text-gray-500">En alta indiğinizde “PDF indir” aktif olur.</div>
        </div>

        <div
          ref={bodyRef}
          onScroll={onScroll}
          className="p-5 overflow-auto text-[14px] leading-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="p-4 border-t flex items-center justify-between gap-3">
          {err ? (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          ) : <span />}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg border" onClick={onClose}>Kapat</button>
            {/* <button className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-60"
                    onClick={downloadPdf} disabled={!canDownload}>
              PDF indir
            </button> */}
          </div>
        </div>
      </div>
    </div>
  )
}
