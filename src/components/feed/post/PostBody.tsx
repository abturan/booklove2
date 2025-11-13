// src/components/feed/post/PostBody.tsx
import { useMemo, useState } from 'react'
import LinkifiedText from './utils/LinkifiedText'
export default function PostBody({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const max = 80
  const truncated = text.length > max && !expanded
  const preview = text.slice(0, max).trimEnd()
  const previewWithEllipsis = preview.endsWith('…') ? preview : `${preview}…`
  const full = useMemo(() => <LinkifiedText text={text} />, [text])
  return (
    <div className="mt-1 text-sm whitespace-pre-wrap break-words">
      {truncated ? (
        <>
          <LinkifiedText text={previewWithEllipsis} />{' '}
          <button type="button" onClick={() => setExpanded(true)} className="text-rose-600 hover:underline text-xs">
            Devamını oku
          </button>
        </>
      ) : (
        full
      )}
    </div>
  )
}
