//src/components/profile/AvatarUpload.tsx

'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type Props = {
  initialUrl?: string | null
  onFileSelect?: (file: File | null) => void
  className?: string
}

export default function AvatarUpload({ initialUrl, onFileSelect, className }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shadow bg-gray-100">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-400 text-xs">
            Önizleme
          </div>
        )}
      </div>
      <label className="relative inline-flex">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            setFile(f)
            onFileSelect?.(f)
          }}
        />
        <Button type="button" variant="secondary">Dosya Seç</Button>
      </label>
      <span className="text-xs text-gray-500">Tüm görsel formatları desteklenir; maksimum 5MB.</span>
    </div>
  )
}
