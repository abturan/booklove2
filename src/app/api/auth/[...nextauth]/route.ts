// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth'

// Auth.js v5 (NextAuth v5) için:
export const { GET, POST } = handlers