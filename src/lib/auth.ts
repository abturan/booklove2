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
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  // 🔒 Hata ve giriş sayfasını sabitliyoruz: hata olursa hep /auth/signin'de kal
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null

        const email = String(creds.email).trim()
        const password = String(creds.password)

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
        if (!user || !user.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
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
  callbacks: {
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
})
