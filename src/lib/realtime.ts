// src/lib/realtime.ts
import { EventEmitter } from 'events'

type Payload = { threadId: string; message: any }

const g = globalThis as any
if (!g.__dmEmitter) {
  g.__dmEmitter = new EventEmitter()
  g.__dmEmitter.setMaxListeners(0)
}
export const dmEmitter: EventEmitter = g.__dmEmitter

export function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  }
}

export function formatEvent(data: any) {
  return `data: ${JSON.stringify(data)}\n\n`
}
