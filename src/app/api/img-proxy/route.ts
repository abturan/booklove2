// src/app/api/img-proxy/route.ts
import { NextResponse } from 'next/server'

const ALLOWED_HOSTS = new Set([
  'images.unsplash.com',
  'api.dicebear.com',
  'blob.vercel-storage.com',
])

function isAllowed(u: URL) {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  if (ALLOWED_HOSTS.has(u.hostname)) return true
  // allow any subdomain of vercel-storage.com
  if (u.hostname.endsWith('.vercel-storage.com')) return true
  return false
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const u = url.searchParams.get('u')
    if (!u) return NextResponse.json({ error: 'missing url' }, { status: 400 })
    let target: URL
    try {
      target = new URL(u)
    } catch {
      // allow same-origin relative path
      const origin = url.origin
      target = new URL(u, origin)
    }
    if (!isAllowed(target)) return NextResponse.json({ error: 'forbidden host' }, { status: 403 })

    const res = await fetch(target.toString(), { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'upstream error' }, { status: 502 })

    const body = await res.arrayBuffer()
    const ct = res.headers.get('content-type') || 'application/octet-stream'
    return new NextResponse(body, {
      headers: {
        'content-type': ct,
        'cache-control': 'public, max-age=3600',
        'access-control-allow-origin': '*',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
