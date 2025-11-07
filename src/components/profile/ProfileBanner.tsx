// src/components/profile/ProfileBanner.tsx
'use client'

import * as React from 'react'
import Image from 'next/image'
import BannerEditor from '@/components/profile/BannerEditor'

type Props = { src?: string | null; canEdit?: boolean; isAdmin?: boolean }

export default function ProfileBanner({ src, canEdit = false, isAdmin = false }: Props) {
  const fallback = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop'
  const [current, setCurrent] = React.useState<string>(src || fallback)

  React.useEffect(() => {
    setCurrent(src || fallback)
  }, [src])

  return (
    <div className="relative hero-fixed rounded-3xl overflow-hidden">
      <Image src={current} alt="" fill className="object-cover" priority />
      {canEdit && (
        <BannerEditor
          initialUrl={src || undefined}
          onSaved={(url) => setCurrent(url || fallback)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
