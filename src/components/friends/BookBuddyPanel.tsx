// src/components/friends/BookBuddyPanel.tsx
'use client'

import { useMemo, useState } from 'react'
import { userPath } from '@/lib/userPath'
import { useAuth } from './hooks/useAuth'
import { useResponsive } from './hooks/useResponsive'
import { useBuddyCounts } from './hooks/useBuddyCounts'
import { useBuddyPanelLists } from './hooks/useBuddyPanelLists'
import { useSuggestions } from './hooks/useSuggestions'
import HeaderBar from './panel/HeaderBar'
import SearchBox from './panel/SearchBox'
import SummaryBar from './panel/SummaryBar'
import FriendsAvatars from './panel/FriendsAvatars'
import CollapsibleSection from './panel/CollapsibleSection'
import EmptyRow from './panel/EmptyRow'
import IncomingRow from './panel/IncomingRow'
import FriendRow from './panel/FriendRow'
import OutgoingRow from './panel/OutgoingRow'

export default function BookBuddyPanel({ active = true }: { active?: boolean }) {
  const { authed } = useAuth()
  const { isDesktop, inputShell, wrapRing } = useResponsive()

  const enabled = Boolean(active && authed)

  const { pendingCount, unreadDm } = useBuddyCounts(enabled)
  const lists = useBuddyPanelLists(enabled)
  const sug = useSuggestions(enabled)

  const [expanded, setExpanded] = useState(true)
  const [compact, setCompact] = useState(true)

  const totalHeaderCount = pendingCount + unreadDm
  const visible = useMemo(() => (expanded ? lists.friends : lists.friends.slice(0, 5)), [lists.friends, expanded])

  if (authed === false) return null

  const sections = (
    <div className="space-y-6">
      <CollapsibleSection title="Book Buddy" count={lists.friends.length}>
        {lists.friends.length === 0 && <EmptyRow text="Henüz Book Buddy yok." />}
        {lists.friends.map(u => <FriendRow key={`f-${u.id}`} u={u} userPath={userPath} />)}
      </CollapsibleSection>
      <CollapsibleSection title="Gelen istekler" count={lists.incoming.length}>
        {lists.incoming.length === 0 && <EmptyRow text="Bekleyen istek yok." />}
        {lists.incoming.map(u => <IncomingRow key={`in-${u.id}`} u={u} userPath={userPath} onAccept={() => lists.acceptIncoming(u.id)} />)}
      </CollapsibleSection>
      <CollapsibleSection title="Gönderilen istekler" count={lists.outgoing.length}>
        {lists.outgoing.length === 0 && <EmptyRow text="Gönderilmiş istek yok." />}
        {lists.outgoing.map(u => (
          <OutgoingRow key={`out-${u.id}`} u={u} userPath={userPath} onCancel={() => lists.cancelOutgoing(u.id)} />
        ))}
      </CollapsibleSection>
    </div>
  )

  return (
    <>
      {!isDesktop && (
        <div className="space-y-4">
          <HeaderBar totalCount={totalHeaderCount} compact={false} onToggleCompact={() => {}} />
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
            placeholder="Book Buddy'lerini Bul"
            inputShell={inputShell}
            userPath={userPath}
            sets={lists.sets}
            addFriend={lists.addFriend}
            acceptIncoming={lists.acceptIncoming}
          />

          <div className="max-w-full">
            <FriendsAvatars friends={lists.friends} userPath={userPath} />
          </div>

          {sections}
        </div>
      )}

      {isDesktop && (
        <section className={`mb-10 rounded-2xl ring-1 ${wrapRing} shadow-sm overflow-hidden`}>
          <div className="bg-primary text-white p-5 space-y-3 relative">
            <HeaderBar totalCount={totalHeaderCount} compact={compact} onToggleCompact={() => setCompact(v => !v)} />
            <SearchBox
              {...sug}
              placeholder="Book Buddy'lerini Bul"
              inputShell={inputShell}
              userPath={userPath}
              sets={lists.sets}
              addFriend={lists.addFriend}
              acceptIncoming={lists.acceptIncoming}
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
              <div className="max-w-full">
                <FriendsAvatars friends={visible} userPath={userPath} />
                {lists.friends.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(v => !v)}
                    className="text-sm font-medium text-primary hover:underline"
                    aria-expanded={expanded}
                  >
                    {expanded ? 'Daralt' : 'Tümünü göster'}
                  </button>
                )}
              </div>
              {expanded && sections}
            </div>
          )}
        </section>
      )}
    </>
  )
}






