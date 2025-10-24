// src/app/api/posts/counts/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [published, pending, hidden, reported] = await Promise.all([
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'PENDING' } }),
      prisma.post.count({ where: { status: 'HIDDEN' } }),
      prisma.post.count({ where: { reports: { some: {} }, NOT: { status: 'HIDDEN' } } }),
    ])

    return NextResponse.json({ published, pending, hidden, reported })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'counts failed' }, { status: 500 })
  }
}
