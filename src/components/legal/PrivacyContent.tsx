// src/components/legal/PrivacyContent.tsx
import { privacyHtml } from '@/content/legal/privacy'

export default function PrivacyContent() {
  return (
    <div
      className="
        prose prose-neutral max-w-none leading-[1.8]
        prose-headings:text-[12px] prose-p:text-[12px] prose-li:text-[12px]
        prose-a:text-[12px] prose-strong:text-[12px]
        prose-p:my-3 prose-li:my-2 prose-headings:mb-2
      "
      dangerouslySetInnerHTML={{ __html: privacyHtml }}
    />
  )
}