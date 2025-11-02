// src/components/friends/BookBuddyPanel.tsx
'use client'

import { useState } from 'react'
import { userPath } from '@/lib/userPath'
import { useAuth } from './hooks/useAuth'
import { useResponsive } from './hooks/useResponsive'
import { useBuddyCounts } from './hooks/useBuddyCounts'
import { useBuddyPanelLists } from './hooks/useBuddyPanelLists'
import { useSuggestions } from './hooks/useSuggestions'
import HeaderBar from './panel/HeaderBar'
import SearchBox from './panel/SearchBox'
import SummaryBar from './panel/SummaryBar'
import CollapsibleSection from './panel/CollapsibleSection'
import EmptyRow from './panel/EmptyRow'
import FriendRow from './panel/FriendRow'
import useOnlineMap from '@/lib/hooks/useOnlineMap'

export default function BookBuddyPanel({ active = true }: { active?: boolean }) {
  const { authed } = useAuth()
  const { isDesktop, inputShell, wrapRing } = useResponsive()

  const enabled = Boolean(active && authed)

  const { pendingCount, unreadDm } = useBuddyCounts(enabled)
  const lists = useBuddyPanelLists(enabled)
  const sug = useSuggestions(enabled)

  const [compact, setCompact] = useState(true)

  const totalHeaderCount = pendingCount + unreadDm

  const allIds = [...lists.following, ...lists.followers].map((u) => u.id)
  const online = useOnlineMap(allIds)

  if (authed === false) return null

  const sections = (
    <div className="space-y-6">
      <CollapsibleSection title="Takip" count={lists.following.length} defaultOpen>
        {lists.following.length === 0 && <EmptyRow text="Henüz kimseyi takip etmiyorsun." />}
        {lists.following.map((u) => (
          <FriendRow key={`follow-${u.id}`} u={u} userPath={userPath} allowUnfollow online={!!online[u.id]} />
        ))}
      </CollapsibleSection>
      <CollapsibleSection title="Takipçi" count={lists.followers.length}>
        {lists.followers.length === 0 && <EmptyRow text="Henüz takipçin yok." />}
        {lists.followers.map((u) => (
          <FriendRow key={`follower-${u.id}`} u={u} userPath={userPath} allowUnfollow={false} online={!!online[u.id]} />
        ))}
        {lists.followers.length > 0 && (
          <p className="px-1 pt-1 text-xs text-gray-500">
            Seni takip edenleri `Takip et` butonuyla Book Buddy listenize ekleyebilirsiniz.
          </p>
        )}
      </CollapsibleSection>
    </div>
  )

  return (
    <>
      {!isDesktop && (
        <div className="space-y-4">
          <HeaderBar compact={false} onToggleCompact={() => {}} />
          <div className="h-1 w-full rounded-full bg-primary" />

          {totalHeaderCount > 0 && (
            <SummaryBar
              pendingCount={pendingCount}
              unreadDm={unreadDm}
              compact={false}
              onToggleCompact={() => {}}
            />
          )}

          <SearchBox
            {...sug}
            placeholder="Book Buddy'lerini bul"
            inputShell={inputShell}
            userPath={userPath}
            sets={lists.sets}
            follow={lists.followUser}
            followBack={lists.followBack}
            unfollow={lists.unfollowUser}
          />

          {sections}
        </div>
      )}

      {isDesktop && (
        <section className={`mb-10 rounded-2xl ring-1 ${wrapRing} shadow-sm overflow-hidden`}>
          <div className="bg-primary text-white p-5 space-y-3 relative">
            <HeaderBar compact={compact} onToggleCompact={() => setCompact(v => !v)} />
            <SearchBox
              {...sug}
              placeholder="Book Buddy'lerini bul"
              inputShell={inputShell}
              userPath={userPath}
              sets={lists.sets}
              follow={lists.followUser}
              followBack={lists.followBack}
              unfollow={lists.unfollowUser}
            />
            <div style={{ height: 10 }} />
          </div>

          {totalHeaderCount > 0 && (
            <SummaryBar
              pendingCount={pendingCount}
              unreadDm={unreadDm}
              compact={compact}
              onToggleCompact={() => setCompact(v => !v)}
            />
          )}

          {compact === false && (
            <div className="bg-white p-5 pt-3 space-y-4">
              {sections}
            </div>
          )}
        </section>
      )}
    </>
  )
}
