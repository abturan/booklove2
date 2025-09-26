// src/app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

function extFromType(type: string) {
  if (type === 'image/png') return '.png'
  if (type === 'image/jpeg') return '.jpg'
  return ''
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const kind = url.searchParams.get('type')
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

    const ok = ['image/png', 'image/jpeg']
    if (!ok.includes(file.type))
      return NextResponse.json({ error: 'Sadece PNG/JPG kabul edilir' }, { status: 400 })

    if (file.size > 2 * 1024 * 1024)
      return NextResponse.json({ error: 'Dosya en fazla 2MB olmalı' }, { status: 400 })

    const sub = kind === 'banner' ? 'banners' : kind === 'post' ? 'posts' : 'avatars'
    const filename = `${sub[0]}-${Date.now()}-${Math.floor(Math.random() * 1e6)}${extFromType(file.type)}`

    const useBlob = process.env.VERCEL === '1' || process.env.STORAGE_DRIVER === 'vercel-blob'
    if (useBlob) {
      const { put } = await import('@vercel/blob')
      const key = `uploads/${sub}/${filename}`
      const blob = await put(key, file, { access: 'public', addRandomSuffix: false, contentType: file.type })
      return NextResponse.json({ ok: true, url: blob.url })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const dir = path.join(process.cwd(), 'public', 'uploads', sub)
    await mkdir(dir, { recursive: true })
    const fullpath = path.join(dir, filename)
    await writeFile(fullpath, buffer)
    return NextResponse.json({ ok: true, url: `/uploads/${sub}/${filename}` })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Yükleme hatası' }, { status: 500 })
  }
}





