// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Providers from '@/components/Providers'
import AppChrome from '@/components/AppChrome'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'book.love',
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
          <AppChrome modals={modals}>{children}</AppChrome>
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
