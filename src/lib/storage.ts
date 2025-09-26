// src/lib/storage.ts
import { NextResponse } from 'next/server'

// Production’da Vercel Blob kullan, local’de public klasörüne yaz.
export const useBlob = process.env.VERCEL === '1' || process.env.STORAGE_DRIVER === 'vercel-blob'
