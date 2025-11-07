// src/components/feed/post/hooks/useEdit.ts
import { useRef, useState } from 'react'
import type { Post } from '../types'
import { prepareImageFile } from '@/lib/prepareImageFile'

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    const text = await res.text().catch(() => '')
    return { error: text || 'Beklenmeyen yanıt alındı.' }
  }
}

type EditImage = { url: string; width: number | null; height: number | null }

export function useEdit(post: Post, onUpdated?: (p: Post)=>void, onDeleted?: (id:string)=>void) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.body)
  const [editImages, setEditImages] = useState<EditImage[]>(post.images || [])
  const fileRef = useRef<HTMLInputElement | null>(null)

  function removeEditImage(i: number) { setEditImages((p)=>p.filter((_,x)=>x!==i)) }

  const isImageFile = (file: File) =>
    (file.type && file.type.startsWith('image/')) ||
    (file.name && /\.(heic|heif|hevc|avif|png|jpe?g|gif|webp|bmp|tiff?)$/i.test(file.name))

  async function addEditImages(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = Math.max(0, 5 - editImages.length)
    const arr = Array.from(files).slice(0, room)
    const up: EditImage[] = []
    for (const original of arr) {
      const f = await prepareImageFile(original)
      if (!isImageFile(f)) {
        if (typeof window !== 'undefined') window.alert('Lütfen yalnızca görsel dosyaları seçin.')
        continue
      }
      if (f.size > 5 * 1024 * 1024) {
        if (typeof window !== 'undefined') window.alert('Görseller en fazla 5MB olabilir.')
        continue
      }
      const fd = new FormData(); fd.set('file', f)
      try {
        const r = await fetch('/api/upload?type=post', { method: 'POST', body: fd })
        const j = await safeJson(r)
        if (r.ok && j?.url) {
          up.push({
            url: j.url,
            width: typeof j.width === 'number' ? j.width : null,
            height: typeof j.height === 'number' ? j.height : null,
          })
        } else if (j?.error && typeof window !== 'undefined') {
          window.alert(j.error)
        }
      } catch (err) {
        console.error('[useEdit] upload failed', err)
        if (typeof window !== 'undefined') window.alert('Görsel yüklenemedi, lütfen tekrar deneyin.')
      }
    }
    setEditImages((p)=>[...p, ...up].slice(0,5))
  }

  async function save() {
    const body = editText.trim()
    if (!body && editImages.length===0) return
    try {
      const r = await fetch(`/api/posts/${post.id}`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ body, images: editImages })
      })
      const j = await safeJson(r)
      if (r.ok) {
        setEditing(false); onUpdated?.({ ...post, body, images: editImages })
      } else if (j?.error && typeof window !== 'undefined') {
        window.alert(j.error)
      }
    } catch (err) {
      console.error('[useEdit] save failed', err)
      if (typeof window !== 'undefined') window.alert('Güncelleme başarısız, lütfen tekrar deneyin.')
    }
  }

  async function del() {
    try {
      const r = await fetch(`/api/posts/${post.id}`, { method:'DELETE' })
      const j = await safeJson(r)
      if (r.ok) onDeleted?.(post.id)
      else if (j?.error && typeof window !== 'undefined') window.alert(j.error)
    } catch (err) {
      console.error('[useEdit] delete failed', err)
      if (typeof window !== 'undefined') window.alert('Paylaşım silinemedi, lütfen tekrar deneyin.')
    }
  }

  return { editing, setEditing, editText, setEditText, editImages, setEditImages, fileRef, removeEditImage, addEditImages, save, del }
}
