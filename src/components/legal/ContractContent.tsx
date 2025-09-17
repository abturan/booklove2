// src/components/legal/ContractContent.tsx
import { buildContractHtml } from '@/lib/contract'

export default function ContractContent() {
  const html = buildContractHtml({
    buyerName: '—',
    buyerEmail: '—',
    buyerPhone: '—',
    city: '—',
    district: '—',
    priceTRY: 0,
    startDateISO: new Date().toISOString(),
  })

  return (
    <div
      className="
        prose prose-neutral prose-lg leading-[1.9] max-w-none contract-html
        prose-headings:font-semibold prose-h2:mt-6 prose-h3:mt-5 prose-headings:mb-2
        prose-p:my-4 prose-li:my-2.5
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
