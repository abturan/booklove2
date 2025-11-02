// src/components/SafeImage.tsx
'use client'

import Image, { type ImageProps } from 'next/image'

export default function SafeImage(props: ImageProps & { fallbackSrc?: string }) {
  const { src, fallbackSrc, ...rest } = props as any
  const s = typeof src === 'string' ? src : (src?.src || src?.default || '')
  const final = s && String(s).trim().length > 0 ? String(s) : (fallbackSrc || '')
  if (!final) return null
  return <Image src={final} {...(rest as any)} />
}

