const heicExt = /\.(heic|heif)$/i
const PAYLOAD_LIMIT = 3.5 * 1024 * 1024 // keep request body safely below platform cap

export async function prepareImageFile(file: File): Promise<File> {
  const normalized = await convertHeicIfNeeded(file)
  return await compressIfNeeded(normalized)
}

async function convertHeicIfNeeded(file: File): Promise<File> {
  const type = file.type?.toLowerCase() ?? ''
  const name = file.name ?? ''
  const looksHeic = type.includes('heic') || type.includes('heif') || heicExt.test(name)
  if (!looksHeic) return file
  try {
    const mod = (await import('heic2any')) as any
    const heic2any = mod?.default || mod
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    })
    const blob: Blob =
      Array.isArray(converted) && converted.length > 0
        ? converted[0]
        : (converted as Blob)
    const nextName = name ? name.replace(heicExt, '.jpg') : 'upload.jpg'
    return new File([blob], nextName, { type: 'image/jpeg' })
  } catch (err) {
    console.error('[prepareImageFile] HEIC conversion failed; using original file', err)
    return file
  }
}

async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= PAYLOAD_LIMIT) return file
  try {
    const mod = (await import('browser-image-compression')) as any
    const imageCompression = mod?.default || mod
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: PAYLOAD_LIMIT / (1024 * 1024),
      maxWidthOrHeight: 2560,
      useWebWorker: true,
      fileType: file.type?.startsWith('image/') ? file.type : 'image/jpeg',
    })
    return new File([compressedBlob], ensureExtension(file.name, file.type), {
      type: file.type?.startsWith('image/') ? file.type : 'image/jpeg',
    })
  } catch (err) {
    console.warn('[prepareImageFile] compression skipped:', err)
    return file
  }
}

function ensureExtension(name: string, type?: string | null) {
  if (!name) return fallbackName(type)
  if (/\.(jpe?g|png|webp|gif|avif|bmp|tiff)$/i.test(name)) return name
  if (type?.includes('png')) return `${name}.png`
  if (type?.includes('webp')) return `${name}.webp`
  return `${name}.jpg`
}

function fallbackName(type?: string | null) {
  if (type?.includes('png')) return 'upload.png'
  if (type?.includes('webp')) return 'upload.webp'
  return 'upload.jpg'
}
