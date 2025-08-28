// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Boook.Love',
  description: 'Kitap kulüpleri ve sohbet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${inter.className} min-h-screen flex flex-col relative`}>
        {/* --- SABİT, TEKRAR ETMEYEN ARKA PLAN --- */}
        <div className="fixed inset-0 -z-50 bg-white" aria-hidden="true" />
        {/* Üst-soldan pembe yumuşak leke */}
        <div
          className="fixed inset-0 -z-50 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(120% 120% at -10% -10%, rgba(255, 228, 234, 0.9) 0%, rgba(255, 228, 234, 0.0) 55%)',
          }}
        />
        {/* Alt-sağdan çok hafif açık pembe */}
        <div
          className="fixed inset-0 -z-50 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(120% 120% at 110% 110%, rgba(255, 235, 240, 0.7) 0%, rgba(255, 235, 240, 0.0) 60%)',
          }}
        />

        <Providers>
          <Header />
          {/* içerik */}
          <main className="container mx-auto px-4 py-6 flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
