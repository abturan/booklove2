// src/components/feed/PostAndFeed.tsx
'use client'

import * as React from 'react'
import PostComposer from '@/components/feed/PostComposer'
import InfiniteFeed from '@/components/feed/InfiniteFeed'

export default function PostAndFeed() {
  const [token, setToken] = React.useState(0)
  return (
    <div className="space-y-6">
      <div className="card p-0 overflow-hidden">
        <PostComposer onPosted={() => setToken((x) => x + 1)} />
      </div>
      <div className="space-y-6">
        <InfiniteFeed key={token} scope="friends" />
      </div>
    </div>
  )
}
