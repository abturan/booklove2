// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Providers from '@/components/Providers'
import MobileAppFooter from '@/components/mobile/MobileAppFooter'
import ShareModal from '@/components/modals/ShareModal'
import GlobalVerifyBanner from '@/components/GlobalVerifyBanner'

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
          <GlobalVerifyBanner />
          <main className="container mx-auto px-4 py-6 flex-1 pb-24 sm:pb-6">{children}</main>
          <div className="hidden md:block">
            <Footer />
          </div>
          <div className="md:hidden">
            <MobileAppFooter />
          </div>
          <ShareModal />
          {modals}
        </Providers>
      </body>
    </html>
  )
}





