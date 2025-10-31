// src/components/feed/post/PostEditor.tsx
type EditorImage = { url: string; width?: number | null; height?: number | null }

export default function PostEditor({
  text,
  setText,
  images,
  onRemove,
  fileRef,
  onPick,
  onSave,
  onCancel,
}: {
  text: string
  setText: (v: string) => void
  images: EditorImage[]
  onRemove: (i: number) => void
  fileRef: React.RefObject<HTMLInputElement>
  onPick: (f: FileList | null) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="mt-2 space-y-3">
      <textarea value={text} onChange={(e)=>setText(e.target.value)} rows={3} className="w-full resize-y rounded-2xl border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-rose-200" />
      <div>
        {images.length>0 && (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img,i)=>(
              <div key={i} className="relative">
                <img src={img.url} alt="" className="rounded-xl object-cover w-full h-28" loading="lazy" />
                <button type="button" onClick={()=>onRemove(i)} className="absolute top-1 right-1 rounded-full bg-white/90 border px-2 py-0.5 text-xs hover:bg-white">×</button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e)=>onPick(e.target.files)} />
        <div className="mt-2">
          <button type="button" onClick={()=>fileRef.current?.click()} disabled={images.length>=5} className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60">
            Görsel ekle ({images.length}/5)
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSave} className="rounded-full bg-gray-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-gray-800">Kaydet</button>
        <button type="button" onClick={onCancel} className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50">İptal</button>
      </div>
    </div>
  )
}
