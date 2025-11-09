// src/lib/mail.ts
function resolveFrom(): { name: string; address: string } {
  const raw = (process.env.MAIL_FROM || '').trim()
  const fallbackName = (process.env.MAIL_FROM_NAME || 'Boook Love').trim()
  const fallbackAddr = (process.env.MAIL_FROM_ADDRESS || 'noreply@book.love').trim()

  if (raw) {
    // Try to parse formats like: "Name <addr@host>" or just "addr@host"
    const m = raw.match(/^(.*)<\s*([^>]+)\s*>\s*$/)
    if (m) {
      const name = (m[1] || '').replace(/[<>]/g, '').trim() || fallbackName
      const address = (m[2] || '').trim() || fallbackAddr
      return { name, address }
    }
    if (raw.includes('@')) {
      // just address provided
      return { name: fallbackName, address: raw }
    }
    // just name provided
    return { name: raw.replace(/[<>]/g, '').trim() || fallbackName, address: fallbackAddr }
  }
  return { name: fallbackName, address: fallbackAddr }
}

export async function sendMail(to: string, subject: string, html: string) {
  const from = resolveFrom()
  try {
    const nodemailer = await import('nodemailer')
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    })
    await transporter.sendMail({ to, from, subject, html })
  } catch (e) {
    // Production'da hatayı görünür kıl; local/dev'de sessiz geç
    if (process.env.NODE_ENV === 'production') {
      console.error('[MAIL] Gönderim hatası:', (e as any)?.message || e)
    } else {
      console.log(`[DEV] Mail to ${to}: ${subject}`)
    }
  }
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const subject = 'Şifre Sıfırlama'
  const html = `<p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla:</p><p><a href="${link}">${link}</a></p><p>Bu bağlantı 12 saat içinde geçerlidir.</p>`
  await sendMail(to, subject, html)
}
