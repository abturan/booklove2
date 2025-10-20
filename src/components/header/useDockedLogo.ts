// src/components/header/useDockedLogo.ts
'use client'

import { useEffect, useState } from 'react'

export function useDockedLogo() {
  const [dockedLogo, setDockedLogo] = useState(false)
  useEffect(() => {
    const hasHero = !!document.querySelector('.hero-fixed')
    if (!hasHero) setDockedLogo(true)
    const onDock = (e: Event) => {
      const det = (e as CustomEvent<boolean>).detail
      setDockedLogo(typeof det === 'boolean' ? det : hasHero ? false : true)
    }
    window.addEventListener('hero:dock', onDock as EventListener)
    return () => window.removeEventListener('hero:dock', onDock as EventListener)
  }, [])
  return dockedLogo
}
