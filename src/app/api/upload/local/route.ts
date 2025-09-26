// src/app/api/upload/local/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const kind = (form.get('kind') as string) || 'misc'
  if (!file) return NextResponse.json({ ok: false, error: 'Dosya yok' }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const rel = path.join('uploads', kind, session.user.id, `${Date.now()}.${ext}`)
  const abs = path.join(process.cwd(), 'public', rel)

  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, bytes)

  return NextResponse.json({ ok: true, url: `/${rel}` })
}
