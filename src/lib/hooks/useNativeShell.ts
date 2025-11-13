// src/lib/hooks/useNativeShell.ts
'use client'

import { useEffect, useState } from 'react'
import { detectNativeShell, type NativeShellState } from '@/lib/nativeShell'

type Options = { applyBodyClass?: boolean }

let bodyClassUsers = 0

function applyBodyClass(state: NativeShellState) {
  const body = typeof document !== 'undefined' ? document.body : null
  if (!body) return
  const className = 'native-shell'
  if (state.isNative) {
    body.classList.add(className)
    body.dataset.nativePlatform = state.platform
  } else {
    body.classList.remove(className)
    delete body.dataset.nativePlatform
  }
}

function cleanupBodyClass() {
  const body = typeof document !== 'undefined' ? document.body : null
  if (!body) return
  body.classList.remove('native-shell')
  delete body.dataset.nativePlatform
}

export function useNativeShell(options?: Options) {
  const apply = options?.applyBodyClass ?? false
  const [state, setState] = useState<NativeShellState>(() => ({ isNative: false, platform: 'web', forced: null }))

  useEffect(() => {
    if (typeof window === 'undefined') return
    const readyEvents = ['app-shell-ready', 'deviceready', 'capacitorReady']
    const maxAttempts = 30
    let attempts = 0
    let stopped = false

    const update = () => {
      const next = detectNativeShell()
      setState((prev) => {
        if (prev.isNative && !next.isNative && next.forced !== 'web') {
          // Native moduna geçtikten sonra tekrar web'e düşme; yalnızca web'e zorla paramı varsa izin ver
          if (prev.platform !== next.platform && next.platform !== 'unknown') {
            return { ...prev, platform: next.platform }
          }
          return prev
        }
        if (prev.isNative === next.isNative && prev.platform === next.platform && prev.forced === next.forced) {
          return prev
        }
        return next
      })
      return next
    }

    const poll = () => {
      if (stopped) return
      attempts += 1
      const next = update()
      const capReady = Boolean((window as any)?.Capacitor)
      if (capReady || next.isNative || attempts >= maxAttempts) {
        window.clearInterval(timer)
      }
    }

    const timer = window.setInterval(poll, 200)
    readyEvents.forEach((evt) => window.addEventListener(evt, update))
    update()

    return () => {
      stopped = true
      window.clearInterval(timer)
      readyEvents.forEach((evt) => window.removeEventListener(evt, update))
    }
  }, [])

  useEffect(() => {
    if (!apply || typeof document === 'undefined') return
    bodyClassUsers += 1
    applyBodyClass(state)
    return () => {
      bodyClassUsers = Math.max(0, bodyClassUsers - 1)
      if (bodyClassUsers === 0) cleanupBodyClass()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply])

  useEffect(() => {
    if (!apply || typeof document === 'undefined') return
    applyBodyClass(state)
  }, [apply, state.isNative, state.platform])

  return state
}
