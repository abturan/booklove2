// src/components/legal/PrivacyContent.tsx
import { privacyHtml } from '@/content/legal/privacy'

export default function PrivacyContent() {
  return (
    <div
      className="prose prose-neutral prose-lg leading-[1.9] max-w-none prose-p:my-4 prose-li:my-2.5 prose-headings:mt-6 prose-headings:mb-2"
      dangerouslySetInnerHTML={{ __html: privacyHtml }}
    />
  )
}
