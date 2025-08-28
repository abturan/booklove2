// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'ADMIN' | 'MODERATOR' | 'USER' | string
      avatarUrl?: string | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: 'ADMIN' | 'MODERATOR' | 'USER' | string
    avatarUrl?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    avatarUrl?: string | null
  }
}
