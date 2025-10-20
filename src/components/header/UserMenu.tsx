// src/components/header/UserMenu.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Avatar from '@/components/Avatar'
import { useMe } from './useMe'
import AuthButtons from './AuthButtons'

export default function UserMenu() {
  const { status } = useSession()
  const { me, loaded } = useMe()
  const router = useRouter()
  const [menu, setMenu] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  if (status !== 'authenticated') return <AuthButtons />

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut({ redirect: false })
      router.push('/', { scroll: false })
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setMenu(v=>!v)} className="inline-flex items-center justify-center" title="Menü">
        {loaded && <Avatar src={me?.avatarUrl ?? null} size={36} alt="Profil" />}
      </button>
      {menu && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg overflow-hidden" onMouseLeave={()=>setMenu(false)}>
          <Link href="/profile/settings" scroll={false} className="block px-3 py-2 text-sm hover:bg-gray-50">Profil ayarları</Link>
          <Link href="/subscriptions" scroll={false} className="block px-3 py-2 text-sm hover:bg-gray-50">Abonelikler</Link>
          <Link href="/friends" scroll={false} className="block px-3 py-2 text-sm hover:bg-gray-50">Book Buddy</Link>
          <Link href="/messages" scroll={false} className="block px-3 py-2 text-sm hover:bg-gray-50">Mesajlar</Link>
          <button onClick={handleSignOut} disabled={signingOut} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
            {signingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
          </button>
        </div>
      )}
    </div>
  )
}
