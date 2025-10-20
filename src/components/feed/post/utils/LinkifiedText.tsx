// src/components/feed/post/utils/LinkifiedText.tsx
import Link from 'next/link'
import { userPath } from '@/lib/userPath'
export default function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(/(\B@[a-zA-Z0-9_]+)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('@') && p.length > 1 ? (
          <Link key={i} href={userPath(p.slice(1), p.slice(1), p.slice(1))} className="text-rose-600 hover:underline">
            {p}
          </Link>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}
