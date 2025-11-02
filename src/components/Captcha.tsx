// src/components/Captcha.tsx
'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { grecaptcha?: any }
}

export default function Captcha({ onVerify }: { onVerify: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
  const ref = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<number | null>(null)
  const onVerifyRef = useRef(onVerify)
  onVerifyRef.current = onVerify

  useEffect(() => {
    if (!siteKey) {
      onVerify('dev')
      return
    }

    let cancelled = false

    function render() {
      if (cancelled || !ref.current || !window.grecaptcha) return
      try {
        if (widgetIdRef.current === null) {
          widgetIdRef.current = window.grecaptcha.render(ref.current, {
            sitekey: siteKey,
            callback: (token: string) => onVerifyRef.current(token),
            'expired-callback': () => onVerifyRef.current(''),
            'error-callback': () => onVerifyRef.current(''),
          })
        }
      } catch {}
    }

    function ensureScript(): Promise<void> {
      if (window.grecaptcha?.render) return Promise.resolve()
      return new Promise((resolve) => {
        const id = 'recaptcha-script'
        if (!document.getElementById(id)) {
          const s = document.createElement('script')
          s.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
          s.async = true
          s.defer = true
          s.id = id
          s.onload = () => resolve()
          document.body.appendChild(s)
        } else {
          // script var; biraz bekleyip resolve et
          const check = () => (window.grecaptcha?.render ? resolve() : setTimeout(check, 50))
          check()
        }
      })
    }

    ensureScript().then(() => {
      if (cancelled) return
      if (window.grecaptcha?.ready) window.grecaptcha.ready(() => render())
      else render()
    })

    return () => {
      cancelled = true
    }
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={ref} />
}
