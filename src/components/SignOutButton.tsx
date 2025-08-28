'use client'
import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-3 py-1.5 rounded-full bg-gray-900 text-white"
    >
      Çıkış yap
    </button>
  )
}
