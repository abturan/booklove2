// src/app/u/[username]/_components/ProfileTabs.tsx
'use client'

import * as React from 'react'
import clsx from 'clsx'

type TabKey = 'clubs' | 'posts'

export default function ProfileTabs({
  initialActive = 'posts',
  clubsNode,
  postsNode,
}: {
  initialActive?: TabKey
  clubsNode: React.ReactNode
  postsNode: React.ReactNode
}) {
  const [active, setActive] = React.useState<TabKey>(initialActive)
  const Btn = ({ k, label }: { k: TabKey; label: string }) => (
    <button
      type="button"
      onClick={() => setActive(k)}
      className={clsx(
        'h-10 rounded-xl text-sm font-semibold grid place-items-center transition',
        active===k ? 'bg-primary text-white shadow' : 'text-gray-700 hover:bg-gray-100'
      )}
      aria-current={active===k ? 'page' : undefined}
    >
      {label}
    </button>
  )
  return (
    <div className="space-y-4">
      <div className="w-full rounded-2xl bg-white/80 backdrop-blur p-1 ring-1 ring-black/5 shadow-sm grid grid-cols-2 gap-1">
        <Btn k="clubs" label="Kulüpler" />
        <Btn k="posts" label="Bookie!" />
      </div>
      <div className={active==='clubs'?'block':'hidden'}>{clubsNode}</div>
      <div className={active==='posts'?'block':'hidden'}>{postsNode}</div>
    </div>
  )
}
