// src/components/PublicVisibilityCard.tsx
'use client'

import * as React from 'react'
import { LinkIcon, EyeIcon } from 'lucide-react'

export default function PublicVisibilityCard({ username }: { username?: string | null }) {
  const [origin, setOrigin] = React.useState<string>('')

  React.useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  const hasUsername = typeof username === 'string' && username.trim().length > 0
  const safeUsername = hasUsername ? username!.trim() : ''
  const publicPath = hasUsername ? `/u/${safeUsername}` : null
  const publicUrl = publicPath ? `${origin || ''}${publicPath}` : ''

  async function copyUrl() {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      alert('Public profil adresi kopyalandı.')
    } catch {
      alert('Kopyalama başarısız oldu.')
    }
  }

  return (
    <div className="card p-4 space-y-3 text-sm">
      <div className="font-medium">Profilini herkese görünür yap</div>

      {!hasUsername ? (
        <>
          <div className="text-gray-600">
            Public profil adresin için önce bir <strong>kullanıcı adı</strong> belirlemelisin.
          </div>
          <a
            href="/profile/settings#username"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-white hover:bg-gray-800"
          >
            <LinkIcon className="w-4 h-4" />
            Kullanıcı adı belirle
          </a>
        </>
      ) : (
        <>
          <div className="text-gray-600">
            Public profilin: <span className="font-medium">{publicPath}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={publicPath!}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-white hover:bg-rose-500"
            >
              <EyeIcon className="w-4 h-4" />
              Profili görüntüle
            </a>
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2"
            >
              <LinkIcon className="w-4 h-4" />
              Kopyala
            </button>
          </div>
        </>
      )}
    </div>
  )
}
