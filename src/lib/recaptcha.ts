// src/lib/recaptcha.ts
export async function verifyRecaptcha(token?: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return true // dev ortamı: doğrulamayı atla
  if (!token) return false
  try {
    const form = new URLSearchParams({ secret, response: token })
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      cache: 'no-store',
    })
    const j = await res.json().catch(() => null)
    return Boolean(j?.success)
  } catch {
    return false
  }
}

