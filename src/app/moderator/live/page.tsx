import { auth } from '@/lib/auth'

export default async function Live() {
  const session = await auth()
  if ((session as any)?.role !== 'MODERATOR') return <div className="mt-10">Unauthorized</div>
  return (
    <div className="card p-6 max-w-xl mx-auto text-center">
      <h2 className="text-xl font-semibold">Canlı Yayın (Beta)</h2>
      <p className="mt-2 text-gray-600">LiveKit entegrasyonu için hazır. Bu sürümde yalnızca placeholder.</p>
      <button className="mt-4 rounded-2xl bg-gray-900 text-white px-4 py-2" disabled>Yayını Başlat</button>
    </div>
  )
}
