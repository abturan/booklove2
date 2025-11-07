const heicExt = /\.(heic|heif)$/i

export async function prepareImageFile(file: File): Promise<File> {
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

