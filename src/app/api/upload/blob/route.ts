// src/app/api/upload/blob/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null
  const kind = (form.get('kind') as string) || 'misc' // 'avatar' | 'feed' vb.
  if (!file) return NextResponse.json({ ok: false, error: 'Dosya yok' }, { status: 400 })

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const key = `uploads/${kind}/${session.user.id}/${Date.now()}.${ext}`

  // Dinamik import → paket boyutunu küçültür, Edge’e bundling yapılmaz
  const { put } = await import('@vercel/blob')
  const blob = await put(key, file, { access: 'public', addRandomSuffix: false, contentType: file.type })

  return NextResponse.json({ ok: true, url: blob.url, key })
}
