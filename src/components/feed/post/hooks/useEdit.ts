// src/components/feed/post/hooks/useEdit.ts
import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { Post } from '../types'

type EditImage = { url: string; width: number | null; height: number | null }

export function useEdit(post: Post, onUpdated?: (p: Post)=>void, onDeleted?: (id:string)=>void) {
  const { data } = useSession()
  const isAdmin = ((data?.user as any)?.role ?? '') === 'ADMIN'
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
    for (const f of arr) {
      if (!isImageFile(f)) {
        if (typeof window !== 'undefined') window.alert('Lütfen yalnızca görsel dosyaları seçin.')
        continue
      }
      if (!isAdmin && f.size > 5 * 1024 * 1024) {
        if (typeof window !== 'undefined') window.alert('Görseller en fazla 5MB olabilir.')
        continue
      }
      const fd = new FormData(); fd.set('file', f)
      const r = await fetch('/api/upload?type=post', { method: 'POST', body: fd })
      const j = await r.json(); if (r.ok && j?.url) up.push({
        url: j.url,
        width: typeof j.width === 'number' ? j.width : null,
        height: typeof j.height === 'number' ? j.height : null,
      })
    }
    setEditImages((p)=>[...p, ...up].slice(0,5))
  }

  async function save() {
    const body = editText.trim()
    if (!body && editImages.length===0) return
    const r = await fetch(`/api/posts/${post.id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ body, images: editImages })
    })
    if (r.ok) { setEditing(false); onUpdated?.({ ...post, body, images: editImages }) }
  }

  async function del() {
    const r = await fetch(`/api/posts/${post.id}`, { method:'DELETE' })
    if (r.ok) onDeleted?.(post.id)
  }

  return { editing, setEditing, editText, setEditText, editImages, setEditImages, fileRef, removeEditImage, addEditImages, save, del }
}
