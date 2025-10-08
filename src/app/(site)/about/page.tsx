// src/app/(site)/about/page.tsx
import ManifestoContent from '@/components/legal/ManifestoContent'

export const metadata = { title: 'Manifesto — bo❤️ok.love' }

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <ManifestoContent />
    </main>
  )
}
