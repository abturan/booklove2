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

export default function RootLayout({
  children,
  modals,
}: {
  children: React.ReactNode
  modals: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="container mx-auto px-4 py-6 flex-1">{children}</main>
          <Footer />
          {modals}
        </Providers>
      </body>
    </html>
  )
}
