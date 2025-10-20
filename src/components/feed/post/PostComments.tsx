// src/components/feed/post/PostComments.tsx
import Link from 'next/link'
import { userPath } from '@/lib/userPath'
export default function PostComments({ open, loading, items, text, setText, onSend, canInteract }: { open: boolean; loading: boolean; items: any[]; text: string; setText: (v: string)=>void; onSend: ()=>void; canInteract: boolean }) {
  if (!open) return null
  return (
    <div className="mt-3 space-y-2">
      {loading ? <div className="text-xs text-gray-500">Yorumlar yükleniyor…</div> : items.length === 0 ? <div className="text-xs text-gray-500">Henüz yorum yok.</div> : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="rounded-2xl bg-gray-50 p-2">
              <div className="text-xs text-gray-500">
                <Link href={userPath(c.user?.username, c.user?.name, c.user?.slug)} className="font-medium hover:underline">
                  {c.user?.name || 'Kullanıcı'}
                </Link>{' '}· {new Date(c.createdAt).toLocaleString()}
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">{c.body}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Giriş yapmadan yorum yapamazsın" rows={2} disabled={!canInteract} className="flex-1 resize-none rounded-xl border border-gray-200 p-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-gray-50 disabled:opacity-60" />
        <button type="button" onClick={canInteract ? onSend : undefined} disabled={!canInteract || !text.trim()} className="self-end rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed">
          Gönder
        </button>
      </div>
    </div>
  )
}
