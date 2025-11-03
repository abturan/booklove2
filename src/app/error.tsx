'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">Bir hata oluştu</h1>
      <p className="mt-2 text-gray-600">{error?.message || 'Bilinmeyen hata'}</p>
      <button onClick={reset} className="mt-4 rounded-xl border px-4 py-2 hover:bg-gray-50">Tekrar dene</button>
    </div>
  )
}
