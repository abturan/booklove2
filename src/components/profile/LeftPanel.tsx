// src/components/profile/LeftPanel.tsx
'use client'

import Image from 'next/image'
import ShortcutCard from '@/components/ShortcutCard'
import SignOutButton from '@/components/SignOutButton'

export type LeftPanelMe = {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
}

/** Ayarlar/Feed/Subscriptions sayfalarında kullanılan SOL PANEL (tek kaynak) */
export default function LeftPanel({ me }: { me: LeftPanelMe }) {
  const avatar =
    me.avatarUrl ||
    `https://api.dicebear.com/8.x/thumbs/png?seed=${encodeURIComponent(me.id)}`

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white">
            <Image
              src={avatar}
              alt={me.name || 'Kullanıcı'}
              fill
              className="object-cover"
              unoptimized={avatar.startsWith('/uploads/')}
            />
          </div>
          <div>
            <div className="font-medium">{me.name || 'Kullanıcı'}</div>
            <div className="text-sm text-gray-600">{me.email}</div>
          </div>
        </div>
      </div>

      <ShortcutCard />

      <div className="card p-4">
        <SignOutButton />
      </div>

      <div className="card p-4 space-y-2 text-sm text-gray-600">
        <div>Profil bilgilerini güncel tut; öneriler ve kulüp seçimleri buna göre iyileşir.</div>
      </div>
    </div>
  )
}
