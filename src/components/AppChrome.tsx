'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MobileAppFooter from '@/components/mobile/MobileAppFooter'
import GlobalVerifyBanner from '@/components/GlobalVerifyBanner'
import PresencePinger from '@/components/PresencePinger'
import ClientErrorCatcher from '@/components/ClientErrorCatcher'
import ShareModal from '@/components/modals/ShareModal'

export default function AppChrome({ children, modals }: { children: React.ReactNode; modals: React.ReactNode }) {
  const pathname = usePathname()
  const isMeetingRoute = pathname?.startsWith('/meet') ?? false

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isMeetingRoute) {
      document.body.classList.add('meet-fullscreen')
    } else {
      document.body.classList.remove('meet-fullscreen')
    }
    return () => document.body.classList.remove('meet-fullscreen')
  }, [isMeetingRoute])

  const mainClass = isMeetingRoute
    ? 'fixed inset-0 bg-black text-white overflow-hidden'
    : 'container mx-auto px-4 py-6 flex-1 pb-24 sm:pb-6'

  return (
    <>
      <PresencePinger />
      <ClientErrorCatcher />
      {!isMeetingRoute && <Header />}
      {!isMeetingRoute && <GlobalVerifyBanner />}
      <main className={mainClass}>{isMeetingRoute ? <div className="h-full w-full">{children}</div> : children}</main>
      {!isMeetingRoute && (
        <>
          <div className="hidden md:block">
            <Footer />
          </div>
          <div className="md:hidden">
            <MobileAppFooter />
          </div>
        </>
      )}
      <ShareModal />
      {modals}
    </>
  )
}
