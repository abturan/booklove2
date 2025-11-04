// src/components/meet/LiveRoom.tsx
'use client'

import React from 'react'
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  StartAudio,
  useTracks,
  useRoomContext,
  Chat,
  FocusLayout,
  FocusLayoutContainer,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import Link from 'next/link'
import { userPath } from '@/lib/userPath'

type Props = {
  token: string
  serverUrl: string
  onLeave?: () => void
  moderatorId?: string
  isModerator?: boolean
  eventId?: string
}

export default function LiveRoom({ token, serverUrl, onLeave, moderatorId, isModerator, eventId }: Props) {
  const [roomKey, setRoomKey] = React.useState(0)

  // If token changes from parent, remount to reconnect
  React.useEffect(() => { setRoomKey((k) => k + 1) }, [token, serverUrl])

  // Lighten the default LiveKit theme so icons are visible
  const themeVars = React.useMemo(() => ({
    // background + foregrounds
    ['--lk-bg' as any]: '#111827', // slate-900
    ['--lk-bg2' as any]: '#0f172a',
    ['--lk-fg' as any]: '#f8fafc', // slate-50
    ['--lk-control-bg' as any]: '#1f2937', // slate-800
    ['--lk-control-hover-bg' as any]: '#27354a',
    ['--lk-control-active-bg' as any]: '#334155',
    ['--lk-control-fg' as any]: '#e5e7eb', // slate-200
    ['--lk-border-color' as any]: 'rgba(255,255,255,0.18)',
    ['--lk-control-bar-height' as any]: '60px',
  }), [])

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <LiveKitRoom
        key={roomKey}
        token={token}
        serverUrl={serverUrl}
        connect
        video={false}
        audio={false}
        options={{ adaptiveStream: true, dynacast: true }}
        onDisconnected={onLeave}
        className="lk-theme-default"
        style={themeVars as React.CSSProperties}
      >
        <RoomContent moderatorId={moderatorId} isModerator={!!isModerator} eventId={eventId} />
      </LiveKitRoom>
    </div>
  )
}

function RoomContent({ moderatorId, isModerator, eventId }: { moderatorId?: string; isModerator: boolean; eventId?: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  )
  const [showDrawer, setShowDrawer] = React.useState(false)
  const [rightTab, setRightTab] = React.useState<'chat' | 'people'>('chat')

  // Keep presence alive so public summary shows moderator/participants online
  React.useEffect(() => {
    if (!eventId) return
    let alive = true
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
    return () => { alive = false; clearInterval(t) }
  }, [eventId])

  // try to focus moderator camera when requested via button
  const modCam = React.useMemo(() => {
    const refs = tracks
      .filter((t) => t.source === Track.Source.Camera && !!t.participant?.identity)
      .find((t) => (moderatorId ? String(t.participant.identity).startsWith(moderatorId) : false))
    return refs
  }, [tracks, moderatorId])

  return (
    <div className="flex w-full flex-col bg-black h-[75vh] sm:h-[60vh]">
      <div className="flex-1 min-h-0">
        <div className="flex h-full w-full">
          <div className="relative min-w-0 flex-1 p-2">
            <div className="absolute left-2 top-2 z-10 flex gap-2">
              {isModerator && (
                <button
                  type="button"
                  onClick={() => setShowDrawer((v) => !v)}
                  className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
                >
                  Yönet Paneli
                </button>
              )}
            </div>
            <div className="h-full rounded-xl overflow-hidden meeting-grid">
              {modCam ? (
                <FocusLayoutContainer>
                  <GridLayout className="hidden md:block" tracks={tracks}>
                    <ParticipantTile className="bl-meet-tile" />
                  </GridLayout>
                  <FocusLayout trackRef={modCam} />
                </FocusLayoutContainer>
              ) : (
                <GridLayout className="h-full" tracks={tracks}>
                  <ParticipantTile className="bl-meet-tile" />
                </GridLayout>
              )}
            </div>
          </div>
          <aside className="hidden w-[320px] shrink-0 flex-col border-l border-slate-700 bg-[#0f172a] p-2 text-slate-100 md:flex">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Panel</div>
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-600">
                <button className={`px-3 py-1 text-xs ${rightTab === 'chat' ? 'bg-slate-700' : 'bg-transparent'}`} onClick={() => setRightTab('chat')}>Sohbet</button>
                <button className={`px-3 py-1 text-xs ${rightTab === 'people' ? 'bg-slate-700' : 'bg-transparent'}`} onClick={() => setRightTab('people')}>Kişiler</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-lg">
              {rightTab === 'chat' ? (
                <Chat />
              ) : (
                <PeopleList eventId={eventId} />
              )}
            </div>
          </aside>
        </div>
      </div>
      <div className="border-t border-slate-700 bg-[#111] p-2">
        <RoomAudioRenderer />
        <StartAudio label="Sesi Başlat" />
        <ControlBar variation="minimal" controls={{ chat: false, screenShare: true, leave: false, camera: true, microphone: true }} />
      </div>

      {isModerator && showDrawer && (
        <ModeratorDrawer onClose={() => setShowDrawer(false)} eventId={eventId} />
      )}
    </div>
  )
}

function PeopleList({ eventId }: { eventId?: string }) {
  const [items, setItems] = React.useState<Array<{ userId: string; name: string; handle: string }>>([])
  React.useEffect(() => {
    let alive = true
    async function poll() {
      if (!eventId) return
      try {
        const r = await fetch(`/api/meet/list/${eventId}`, { cache: 'no-store' })
        const j = await r.json().catch(() => null)
        if (!alive || !j?.present) return
        setItems(j.present.map((p: any) => ({ userId: p.userId, name: p.name, handle: p.handle })))
      } catch {}
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => { alive = false; clearInterval(t) }
  }, [eventId])
  return (
    <ul className="divide-y divide-slate-800/60">
      {items.map((p) => (
        <li key={p.userId} className="flex items-center justify-between gap-3 px-2 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm text-slate-100">{p.name}</div>
            <div className="truncate text-xs text-slate-400">@{p.handle}</div>
          </div>
          <Link
            href={userPath(p.handle, p.name, p.handle)}
            target="_blank"
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Profili Aç
          </Link>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-2 py-3 text-xs text-slate-400">Katılımcı listesi yükleniyor…</li>
      )}
    </ul>
  )
}

function ModeratorDrawer({ onClose, eventId }: { onClose: () => void; eventId?: string }) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[320px] overflow-auto border-r border-slate-700 bg-[#0f172a] p-4 text-slate-100 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Moderatör Paneli</div>
          <button onClick={onClose} className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20">Kapat</button>
        </div>
        <div className="text-xs text-slate-300">Katılımcılar</div>
        <PeopleList eventId={eventId} />
      </div>
    </div>
  )
}
