'use client'

import { useState } from 'react'
import BareModal from '@/components/ui/BareModal'
import ProfileAboutCard from '@/components/profile/ProfileAboutCard'

export default function ProfileAboutButton({ bio }: { bio?: string | null }) {
  const text = (bio || '').trim()
  const [open, setOpen] = useState(false)

  if (!text) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
      >
        Hakkında
      </button>
      <BareModal open={open} onClose={() => setOpen(false)}>
        <ProfileAboutCard bio={text} />
      </BareModal>
    </>
  )
}
