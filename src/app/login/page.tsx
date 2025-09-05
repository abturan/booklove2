// src/app/login/page.tsx
import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto p-6 mt-8">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-11 w-full bg-gray-200 rounded" />
            <div className="h-11 w-full bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
