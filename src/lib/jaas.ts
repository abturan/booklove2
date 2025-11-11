// src/lib/jaas.ts
import crypto from 'crypto'

export type JaasEnv = {
  enabled: boolean
  domain: string
  appId: string
  apiKeyId: string
  privateKey: string
  scriptUrl: string
  jwtTtlSec: number
}

const truthy = (value: string | undefined | null) => {
  if (!value) return false
  const normalized = value.toString().trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

export function getJaasEnv(): JaasEnv | null {
  const enabledFlag = truthy(process.env.JITSI_ENABLED)
    || truthy(process.env.MEETING_ENABLED)
    || truthy(process.env.LIVEKIT_ENABLED)
  const domain = (process.env.JITSI_DOMAIN || '8x8.vc').trim()
  const appId = (process.env.JITSI_APP_ID || '').trim()
  const apiKeyId = (process.env.JITSI_API_KEY_ID || '').trim()
  const privateKeyRaw = (process.env.JITSI_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim()
  const scriptUrl = (process.env.JITSI_EXTERNAL_API_URL || (appId ? `https://${domain}/${appId}/external_api.js` : '')).trim()
  const ttl = Number(process.env.JITSI_JWT_TTL_SEC || '7200')

  if (!enabledFlag) return null
  if (!domain || !appId || !apiKeyId || !privateKeyRaw || !scriptUrl) return null

  let privateKey = privateKeyRaw
  if (privateKey && !privateKey.includes('BEGIN')) {
    try {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf8').trim()
    } catch {
      // leave as-is; signing step will throw with clear error
    }
  }

  return {
    enabled: true,
    domain,
    appId,
    apiKeyId,
    privateKey,
    scriptUrl,
    jwtTtlSec: Number.isFinite(ttl) ? Math.max(600, ttl) : 7200,
  }
}

export function makeJaasRoomSlug(eventId: string) {
  const clean = String(eventId).replace(/[^A-Za-z0-9_-]/g, '')
  return `evt_${clean}`.slice(0, 96)
}

type JwtUser = {
  id: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

const base64Url = (input: string | Buffer) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

export function buildJaasJwt(env: JaasEnv, opts: { roomSlug: string; user: JwtUser; isModerator: boolean }) {
  const now = Math.floor(Date.now() / 1000)
  const header = {
    alg: 'RS256',
    kid: env.apiKeyId,
    typ: 'JWT',
  }
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: env.appId,
    room: opts.roomSlug,
    exp: now + env.jwtTtlSec,
    nbf: now - 10,
    iat: now,
    context: {
      user: {
        id: opts.user.id,
        name: opts.user.name || 'Katılımcı',
        email: opts.user.email || undefined,
        avatar: opts.user.avatarUrl || undefined,
        moderator: opts.isModerator,
      },
    },
  }

  const encodedHeader = base64Url(JSON.stringify(header))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const toSign = `${encodedHeader}.${encodedPayload}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(toSign)
  signer.end()
  const signature = base64Url(signer.sign(env.privateKey))
  return `${toSign}.${signature}`
}

export function makeFullRoomName(env: JaasEnv, slug: string) {
  return `${env.appId}/${slug}`
}
