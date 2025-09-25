//src/components/Providers.tsx
'use client'

import * as React from 'react'
import { SessionProvider } from 'next-auth/react'

/**
 * Uygulama genelindeki client-side provider’lar
 * - SessionProvider: next-auth oturumunu header vb. yerlerde anında günceller
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
