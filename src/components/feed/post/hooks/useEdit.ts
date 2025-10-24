// src/components/feed/post/hooks/useEdit.ts
import { useRef, useState } from 'react'
import type { Post } from '../types'

export function useEdit(post: Post, onUpdated?: (p: Post)=>void, onDeleted?: (id:string)=>void) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.body)
  const [editImages, setEditImages] = useState(post.images || [])
  const fileRef = useRef<HTMLInputElement | null>(null)

  function removeEditImage(i: number) { setEditImages((p)=>p.filter((_,x)=>x!==i)) }

  async function addEditImages(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = Math.max(0, 5 - editImages.length)
    const arr = Array.from(files).slice(0, room)
    const up: any[] = []
    for (const f of arr) {
      const fd = new FormData(); fd.set('file', f)
      const r = await fetch('/api/upload?type=post', { method: 'POST', body: fd })
      const j = await r.json(); if (r.ok && j?.url) up.push({ url: j.url })
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
