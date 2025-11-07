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
    const kind = url.searchParams.get('type') ?? 'avatar'
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })

    const mime = file.type || ''
    const name = typeof (file as any).name === 'string' ? ((file as any).name as string) : ''
    const normalizedName = name.toLowerCase()
    const extPattern = /\.(heic|heif|hevc|avif|png|jpe?g|gif|webp|bmp|tiff?)$/i
    const looksLikeImage = mime.startsWith('image/') || (!!name && extPattern.test(name))
    if (!looksLikeImage) {
      return NextResponse.json({ error: 'Yalnızca görsel dosyalar kabul edilir' }, { status: 400 })
    }

    const sizeLimit = isAdmin ? null : 5 * 1024 * 1024
    if (sizeLimit && file.size > sizeLimit)
      return NextResponse.json({ error: 'Dosya en fazla 5MB olmalı' }, { status: 400 })

    const sub = kind === 'banner' ? 'banners' : kind === 'post' ? 'posts' : 'avatars'
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)
    const isHeicLike = mime.includes('heic') || mime.includes('heif') || /\.hei[cf]$/i.test(name)

    let workingBuffer = inputBuffer
    let workingMime = mime
    if (isHeicLike) {
      try {
        const heicConvertMod = (await import('heic-convert')) as any
        const heicConvert = heicConvertMod?.default || heicConvertMod
        if (typeof heicConvert === 'function') {
          const converted = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.92 })
          workingBuffer = Buffer.isBuffer(converted) ? converted : Buffer.from(converted)
          workingMime = 'image/jpeg'
        }
      } catch (err) {
        console.error('[upload] HEIC dönüşüm hatası:', err)
      }
    }

    let outputBuffer: Buffer
    let width: number | null = null
    let height: number | null = null
    let filename: string
    let contentType: string

    const isGif = workingMime === 'image/gif' || normalizedName.endsWith('.gif')

    try {
      if (isGif) {
        const pipeline = sharp(workingBuffer, { failOnError: false, animated: true })
        const meta = await pipeline.metadata()
        width = meta.width ?? null
        height = meta.height ?? null
        outputBuffer = workingBuffer
        filename = `${sub[0]}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.gif`
        contentType = 'image/gif'
      } else {
        const pipeline = sharp(workingBuffer, { failOnError: false })
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
