'use client'

import { useEffect } from 'react'

export default function ClientErrorCatcher() {
  useEffect(() => {
    let reloaded = false
    function onError() {
      // Bazı ilk yüklenişteki nadir hataları sessizce toparlamak için tek seferlik soft refresh
      if (reloaded) return
      reloaded = true
      setTimeout(() => {
        try { window.location.reload() } catch {}
      }, 50)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onError as any)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onError as any)
    }
  }, [])
  return null
}

