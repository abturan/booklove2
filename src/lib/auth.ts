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
  }
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      role: 'ADMIN' | 'MODERATOR' | 'USER' | string
      avatarUrl?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    avatarUrl?: string | null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  debug: process.env.NODE_ENV === 'development',

  // SignIn & Error sayfaları sabit
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },

  callbacks: {
    /**
     * NextAuth’un tüm yönlendirmeleri buradan geçer.
     * Hata URL’lerini ZORLA /auth/signin?error=... yap.
     */
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl)

        // 1) Eğer URL'de error paramı varsa → her zaman /auth/signin?error=...
        const err = u.searchParams.get('error')
        if (err) {
          return `${baseUrl}/auth/signin?error=${encodeURIComponent(err)}`
        }

        // 2) Built-in error/callback sayfaları
        if (u.pathname.includes('/auth/error') || u.pathname.includes('/error')) {
          const err2 = u.searchParams.get('error') ?? 'Unknown'
          return `${baseUrl}/auth/signin?error=${encodeURIComponent(err2)}`
        }

        // 3) callbackUrl ile gelen istekler: sadece aynı origin ise izin ver
        const sameOrigin =
          u.origin === baseUrl ||
          url.startsWith('/') ||
          url.startsWith('#') ||
          url.startsWith('?')

        return sameOrigin ? u.href : baseUrl
      } catch {
        // URL parse edilemezse güvenli varsayılan
        return baseUrl
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role ?? 'USER'
        token.avatarUrl = (user as any).avatarUrl ?? null
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? ''
        session.user.role = (token.role as string) ?? 'USER'
        session.user.avatarUrl = (token.avatarUrl as string | null) ?? null
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

        // authorize(creds) içinde:
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
          },
        })

        console.log('[auth][debug] userByEmail', {
          email,
          found: !!user,
          hasHash: !!user?.passwordHash,
        })

        if (!user || !user.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        console.log('[auth][debug] compare', { ok })

        if (!ok) return null


        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: (user.role as any) ?? 'USER',
          avatarUrl: user.avatarUrl ?? null,
        }
      },
    }),
  ],
})
