// src/lib/livekit.ts
import crypto from 'crypto'
import { AccessToken } from 'livekit-server-sdk'

export type LiveKitEnv = {
  enabled: boolean
  url: string
  apiKey: string
  apiSecret: string
  tokenTtlSec: number
  secretIsBase64: boolean
}

export function getLiveKitEnv(): LiveKitEnv | null {
  const enabled = String(process.env.LIVEKIT_ENABLED || '0').toLowerCase()
  if (!(enabled === '1' || enabled === 'true' || enabled === 'yes' || enabled === 'on')) return null
  const url = String(process.env.LIVEKIT_URL || '')
  const apiKey = String(process.env.LIVEKIT_API_KEY || '')
  const apiSecret = String(process.env.LIVEKIT_API_SECRET || '')
  const ttl = Number(process.env.LIVEKIT_TOKEN_TTL_SEC || '7200') // default 2h
  const secretIsBase64 = ['1','true','yes','on'].includes(String(process.env.LIVEKIT_SECRET_BASE64 || '0').toLowerCase())
  if (!url || !apiKey || !apiSecret) return null
  return { enabled: true, url, apiKey, apiSecret, tokenTtlSec: Number.isFinite(ttl) ? Math.max(600, ttl) : 7200, secretIsBase64 }
}

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function signHS256(data: string, secret: string | Buffer) {
  const key = Buffer.isBuffer(secret) ? secret : secret
  return b64url(crypto.createHmac('sha256', key as any).update(data).digest())
}

export async function buildLiveKitToken(args: {
  apiKey: string
  apiSecret: string
  secretIsBase64?: boolean
  identity: string
  name?: string | null
  roomName: string
  canPublish: boolean
  canSubscribe: boolean
  canPublishData?: boolean
  ttlSec?: number
}): Promise<string> {
  // Prefer official SDK to avoid signature/claim mismatches
  const at = new AccessToken(args.apiKey, args.apiSecret, {
    identity: args.identity,
    name: args.name || undefined,
    ttl: args.ttlSec || 7200,
  })
  at.addGrant({
    room: args.roomName,
    roomJoin: true,
    canPublish: !!args.canPublish,
    canSubscribe: !!args.canSubscribe,
    canPublishData: args.canPublishData !== false,
  } as any)
  const jwt = await at.toJwt()
  return jwt
}

export function makeRoomName(eventId: string) {
  const clean = String(eventId).replace(/[^A-Za-z0-9_-]/g, '')
  return `evt_${clean}`.slice(0, 96)
}
