// src/components/home/BookBuddyTab.tsx
'use client'

import BookBuddyPanel from '@/components/friends/BookBuddyPanel'

export default function BookBuddyTab({ active = true }: { active?: boolean }) {
  return (
    <div className="space-y-4">
      <BookBuddyPanel active={active} />
    </div>
  )
}
