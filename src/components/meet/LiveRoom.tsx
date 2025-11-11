// src/components/meet/LiveRoom.tsx
'use client'

import React from 'react'

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any
  }
}

type Props = {
  domain: string
  roomName: string
  scriptUrl: string
  jwt: string
  displayName?: string
  email?: string | null
  avatarUrl?: string | null
  subject?: string | null
  eventId?: string
  onLeave?: () => void
  isModerator?: boolean
}

const scriptCache = new Map<string, Promise<void>>()

function loadExternalApi(src: string) {
  if (!src) return Promise.reject(new Error('Jitsi script missing'))
  if (scriptCache.has(src)) return scriptCache.get(src)!
  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing && (existing as HTMLScriptElement).dataset.loaded === 'true') {
      resolve()
      return
    }
    const script = (existing as HTMLScriptElement | null) ?? document.createElement('script')
    if (!existing) {
      script.src = src
      script.async = true
      script.dataset.loaded = 'false'
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true'
        resolve()
      }, { once: true })
      script.addEventListener('error', (err) => reject(err), { once: true })
      document.body.appendChild(script)
    } else {
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true'
        resolve()
      }, { once: true })
      script.addEventListener('error', (err) => reject(err), { once: true })
    }
  })
  scriptCache.set(src, promise)
  return promise
}

export default function LiveRoom({
  domain,
  roomName,
  scriptUrl,
  jwt,
  displayName,
  email,
  avatarUrl,
  subject,
  eventId,
  onLeave,
  isModerator = false,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const apiRef = React.useRef<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  const initRoom = React.useCallback(async () => {
    try {
      setError(null)
      await loadExternalApi(scriptUrl)
      if (typeof window === 'undefined' || !window.JitsiMeetExternalAPI) {
        throw new Error('Jitsi API yüklenemedi')
      }
      if (!containerRef.current) return
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
        containerRef.current.innerHTML = ''
      }

      const options = {
        roomName,
        parentNode: containerRef.current,
        jwt,
        lang: 'tr',
        userInfo: {
          displayName: displayName || 'Katılımcı',
          email: email || undefined,
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          subject: subject || 'Etkinlik',
          defaultLanguage: 'tr',
          disableInviteFunctions: !isModerator,
          transcribingEnabled: isModerator,
          liveStreamingEnabled: isModerator,
          recordingEnabled: isModerator,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          MOBILE_APP_PROMO: false,
          TILE_VIEW_MAX_COLUMNS: 3,
          HIDE_INVITE_MORE_HEADER: !isModerator,
          HIDE_INVITE_MORE_BUTTON: !isModerator,
          TOOLBAR_BUTTONS: isModerator
            ? undefined
            : ['microphone', 'camera', 'chat', 'raisehand', 'participants-pane', 'toggle-camera', 'tileview', 'desktop', 'settings', 'shortcuts'],
        },
      }

      const api = new window.JitsiMeetExternalAPI(domain, options)
      apiRef.current = api

      const handleLeave = () => {
        if (onLeave) onLeave()
      }
      api.on('videoConferenceLeft', handleLeave)
      api.on('readyToClose', handleLeave)
      if (subject || avatarUrl) {
        api.on('videoConferenceJoined', () => {
          if (subject) api.executeCommand('subject', subject)
          if (avatarUrl) api.executeCommand('avatarUrl', avatarUrl)
        })
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Jitsi yüklenemedi')
    }
  }, [scriptUrl, domain, roomName, jwt, displayName, email, subject, onLeave, isModerator])

  React.useEffect(() => {
    initRoom()
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
      if (onLeave) onLeave()
    }
  }, [initRoom, onLeave])

  // Keep presence alive for public summary
  React.useEffect(() => {
    if (!eventId) return
    const ping = async () => {
      try {
        await fetch('/api/meet/presence/ping', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ eventId }),
        })
      } catch {}
    }
    ping()
    const t = setInterval(ping, 30000)
    return () => clearInterval(t)
  }, [eventId])

  return (
    <div className="h-full w-full bg-black">
      <div ref={containerRef} className="h-full w-full" />
      {error && (
        <div className="bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      )}
    </div>
  )
}
