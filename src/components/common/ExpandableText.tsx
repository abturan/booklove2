// relative path: src/components/common/ExpandableText.tsx
'use client'

import * as React from 'react'

export default function ExpandableText({
  text,
  maxChars = 200,
  className = '',
}: {
  text: string
  maxChars?: number
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  if (!text) return null
  const needsClamp = text.length > maxChars
  const shown = !needsClamp || open ? text : text.slice(0, maxChars) + '…'

  return (
    <div className={className}>
      <p className="text-[15px] md:text-base leading-6 md:leading-7 text-gray-800">{shown}</p>
      {needsClamp && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-sm font-semibold text-gray-900 underline underline-offset-4"
        >
          {open ? 'Daha az göster' : 'Devamını oku'}
        </button>
      )}
    </div>
  )
}
