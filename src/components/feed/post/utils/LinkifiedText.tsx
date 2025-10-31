// src/components/feed/post/utils/LinkifiedText.tsx
import Link from 'next/link'
import { userPath } from '@/lib/userPath'

const TOKEN_REGEX = /(\B@[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g

export default function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(TOKEN_REGEX)
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null
        if (part.startsWith('@') && part.length > 1) {
          const handle = part.slice(1)
          return (
            <Link key={`${index}-${part}`} href={userPath(handle, handle, handle)} className="text-rose-600 hover:underline">
              {part}
            </Link>
          )
        }
        if (part.startsWith('http://') || part.startsWith('https://')) {
          return (
            <a
              key={`${index}-${part}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="break-words text-rose-600 hover:underline"
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}
