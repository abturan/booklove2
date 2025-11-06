// src/app/api/upload/route.ts
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const session = await auth()
    const role = session?.user?.role ?? 'USER'
    const isAdmin = role === 'ADMIN'

    const url = new URL(req.url)
    const kind = url.searchParams.get('type')
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

    const ok = ['image/png', 'image/jpeg', 'image/webp']
    if (isAdmin) ok.push('image/gif')
    if (!ok.includes(file.type))
      return NextResponse.json({ error: isAdmin ? 'Sadece PNG/JPG/WebP/GIF kabul edilir' : 'Sadece PNG/JPG/WebP kabul edilir' }, { status: 400 })

    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: 'Dosya en fazla 5MB olmalı' }, { status: 400 })

    const sub = kind === 'banner' ? 'banners' : kind === 'post' ? 'posts' : 'avatars'
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    let outputBuffer: Buffer
    let width: number | null = null
    let height: number | null = null
    let filename: string
    let contentType: string

    const isGif = isAdmin && file.type === 'image/gif'

    try {
      if (isGif) {
        const pipeline = sharp(inputBuffer, { failOnError: false, animated: true })
        const meta = await pipeline.metadata()
        width = meta.width ?? null
        height = meta.height ?? null
        outputBuffer = inputBuffer
        filename = `${sub[0]}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.gif`
        contentType = 'image/gif'
      } else {
        const pipeline = sharp(inputBuffer, { failOnError: false })
        const meta = await pipeline.metadata()
        outputBuffer = await pipeline.webp({ quality: 82 }).toBuffer()
        const webpMeta = await sharp(outputBuffer).metadata()
        width = (webpMeta.width ?? meta.width ?? undefined) ? Number(webpMeta.width ?? meta.width) : null
        height = (webpMeta.height ?? meta.height ?? undefined) ? Number(webpMeta.height ?? meta.height) : null
        filename = `${sub[0]}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.webp`
        contentType = 'image/webp'
      }
    } catch (err) {
      console.error('[upload] Görsel dönüştürme hatası:', err)
      return NextResponse.json({ error: 'Görsel işlenemedi, lütfen farklı bir dosya deneyin.' }, { status: 500 })
    }

    const useBlob = process.env.VERCEL === '1' || process.env.STORAGE_DRIVER === 'vercel-blob'
    if (useBlob) {
      const { put } = await import('@vercel/blob')
      const key = `uploads/${sub}/${filename}`
      const blob = await put(key, outputBuffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType,
      })
      return NextResponse.json({ ok: true, url: blob.url, width, height })
    }

    const dir = path.join(process.cwd(), 'public', 'uploads', sub)
    await mkdir(dir, { recursive: true })
    const fullpath = path.join(dir, filename)
    await writeFile(fullpath, outputBuffer)
    return NextResponse.json({ ok: true, url: `/uploads/${sub}/${filename}`, width, height })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Yükleme hatası' }, { status: 500 })
  }
}



