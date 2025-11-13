// src/components/home/DesktopBookBuddySearch.tsx
'use client'

import BookBuddySearchBox from '@/components/friends/panel/SearchBox'
import { useAuth } from '@/components/friends/hooks/useAuth'
import { useBuddyPanelLists } from '@/components/friends/hooks/useBuddyPanelLists'
import { useSuggestions } from '@/components/friends/hooks/useSuggestions'
import { userPath } from '@/lib/userPath'

const DEFAULT_INPUT_SHELL =
  'w-full h-12 rounded-2xl border-2 border-[#fa3d30] bg-white px-4 text-sm text-gray-900 placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-[#fa3d30]/30'

type Props = {
  className?: string
  variant?: 'default' | 'compact'
}

export default function DesktopBookBuddySearch({ className, variant = 'default' }: Props) {
  const { authed } = useAuth()
  const enabled = authed === true
  const lists = useBuddyPanelLists(enabled)
  const sug = useSuggestions(enabled)

  if (!enabled) return null

  const baseWidth = variant === 'compact' ? 'min-w-[240px]' : 'w-full'
  const containerClass = ['hidden md:block', baseWidth, className].filter(Boolean).join(' ')
  const shell =
    variant === 'compact'
      ? 'w-full h-9 rounded-2xl border border-white/60 bg-white/95 px-3 text-xs text-gray-800 placeholder-gray-500 outline-none transition focus:ring-1 focus:ring-[#fa3d30]/30 shadow-sm'
      : DEFAULT_INPUT_SHELL

  return (
    <div className={containerClass}>
      <BookBuddySearchBox
        {...sug}
        placeholder="Book Buddy'lerini bul"
        inputShell={shell}
        userPath={userPath}
        sets={lists.sets}
        follow={lists.followUser}
        followBack={lists.followBack}
        unfollow={lists.unfollowUser}
      />
    </div>
  )
}
