// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

declare module 'next-auth' {
  interface User {
    id: string
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
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
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

        const ok = await bcrypt.compare(creds.password, user.passwordHash)
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
        token.id = user.id
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
