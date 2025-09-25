// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

declare module 'next-auth' {
  interface User {
    id?: string
    role: 'ADMIN' | 'MODERATOR' | 'USER' | string
    avatarUrl?: string | null
    username?: string | null
  }
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      role: 'ADMIN' | 'MODERATOR' | 'USER' | string
      avatarUrl?: string | null
      username?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    avatarUrl?: string | null
    username?: string | null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  debug: process.env.NODE_ENV === 'development',

  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl)
        const err = u.searchParams.get('error')
        if (err) return `${baseUrl}/auth/signin?error=${encodeURIComponent(err)}`
        if (u.pathname.includes('/auth/error') || u.pathname.includes('/error')) {
          const err2 = u.searchParams.get('error') ?? 'Unknown'
          return `${baseUrl}/auth/signin?error=${encodeURIComponent(err2)}`
        }
        const sameOrigin = u.origin === baseUrl || url.startsWith('/') || url.startsWith('#') || url.startsWith('?')
        return sameOrigin ? u.href : baseUrl
      } catch {
        return baseUrl
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role ?? 'USER'
        token.avatarUrl = (user as any).avatarUrl ?? null
        token.username = (user as any).username ?? null
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? ''
        session.user.role = (token.role as string) ?? 'USER'
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null
        session.user.username = (token.username as string | null) ?? null
      }
      return session
    },
  },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null
        const email = String(creds.email || '').trim()
        const password = String(creds.password || '')

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            avatarUrl: true,
            username: true,
          },
        })

        if (!user || !user.passwordHash) return null
        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: (user.role as any) ?? 'USER',
          avatarUrl: user.avatarUrl ?? null,
          username: user.username ?? null,
        }
      },
    }),
  ],
})
