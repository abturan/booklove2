// src/app/iletisim/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'İletişim | book.love',
  description:
    'book.love iletişim bilgileri: adres, telefon ve e-posta.',
  alternates: { canonical: '/iletisim' },
  openGraph: {
    title: 'İletişim | book.love',
    description:
      'book.love iletişim bilgileri: adres, telefon ve e-posta.',
    url: 'https://www.book.love/iletisim',
    siteName: 'book.love',
    type: 'website',
  },
}

const COMPANY = 'book.love'
const ADDRESS_TEXT =
  'Rasimpaşa Mah. Duatepe Sk. No: 55/15 34716 Kadıköy/İstanbul'
const ADDRESS_MAP_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(ADDRESS_TEXT)
const PHONE_DISPLAY = '0 (541) 788 94 98'
const PHONE_TEL = '+905417889498'
const EMAIL = 'info@book.love'

export default function ContactPage() {
  return (
    <>
      {/* SEO: Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: COMPANY,
            url: 'https://www.book.love',
            email: EMAIL,
            telephone: PHONE_TEL,
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Rasimpaşa Mah. Duatepe Sk. No: 55/15',
              postalCode: '34716',
              addressLocality: 'Kadıköy',
              addressRegion: 'İstanbul',
              addressCountry: 'TR',
            },
          }),
        }}
      />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          İletişim
        </h1>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <dt className="text-sm text-gray-600">Şirket</dt>
              <dd className="text-base font-medium">{COMPANY}</dd>
            </div>

            <div className="space-y-1">
              <dt className="text-sm text-gray-600">Telefon</dt>
              <dd className="text-base">
                <a
                  href={`tel:${PHONE_TEL}`}
                  className="text-rose-700 hover:underline"
                >
                  {PHONE_DISPLAY}
                </a>
              </dd>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <dt className="text-sm text-gray-600">E-posta</dt>
              <dd className="text-base break-all">
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-rose-700 hover:underline"
                >
                  {EMAIL}
                </a>
              </dd>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <dt className="text-sm text-gray-600">Adres</dt>
              <dd className="text-base">
                <a
                  href={ADDRESS_MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {ADDRESS_TEXT}
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <iframe
              title="Harita"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                ADDRESS_TEXT,
              )}&output=embed`}
              className="w-full h-72 rounded-xl border"
              loading="lazy"
            />
          </div>
        </div>

       
      </main>
    </>
  )
}



