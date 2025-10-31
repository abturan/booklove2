'use client'

declare global {
  interface Window {
    htmlToImage?: { toPng: (node: HTMLElement, options?: unknown) => Promise<string> }
    __htmlToImagePromise?: Promise<{ toPng: (node: HTMLElement, options?: unknown) => Promise<string> }>
  }
}

const HTML_TO_IMAGE_CDN = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js'

export async function loadHtmlToImage() {
  if (typeof window === 'undefined') return null
  if (window.htmlToImage) return window.htmlToImage
  if (window.__htmlToImagePromise) return window.__htmlToImagePromise

  window.__htmlToImagePromise = new Promise<{ toPng: (node: HTMLElement, options?: unknown) => Promise<string> }>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = HTML_TO_IMAGE_CDN
    script.async = true
    script.onload = () => {
      if (window.htmlToImage) resolve(window.htmlToImage)
      else reject(new Error('html-to-image yüklenemedi'))
    }
    script.onerror = () => reject(new Error('html-to-image yüklenemedi'))
    document.body.appendChild(script)
  }).catch((err) => {
    delete window.__htmlToImagePromise
    throw err
  })

  return window.__htmlToImagePromise
}
