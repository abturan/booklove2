// src/components/profile/AvatarUpload.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type Props = {
  initialUrl?: string | null
  onFileSelect?: (file: File | null) => void
  onUploaded?: (url: string) => void
  className?: string
}

export default function AvatarUpload({ initialUrl, onFileSelect, onUploaded, className }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?type=avatar', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok || !j?.ok || !j?.url) throw new Error(j?.error || 'Yükleme başarısız')
      setPreview(j.url)
      onUploaded?.(j.url)
    } catch (e: any) {
      setError(e?.message || 'Yükleme hatası')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shadow bg-gray-100">
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-400 text-xs">
            Önizleme
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative inline-flex">
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              onFileSelect?.(f)
            }}
          />
          <Button type="button" variant="secondary">Dosya Seç</Button>
        </label>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Yükleniyor…' : 'Yükle'}
        </Button>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">PNG/JPG; maksimum ~2MB önerilir.</span>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}







