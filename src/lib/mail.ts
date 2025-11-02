// src/lib/mail.ts
function resolveFrom(): string | { name: string; address: string } {
  const envFrom = process.env.MAIL_FROM?.trim()
  const name = (process.env.MAIL_FROM_NAME || 'Boook Love').trim()
  const address = (process.env.MAIL_FROM_ADDRESS || 'no-reply@boook.love').trim()
  // If MAIL_FROM provided as full "Name <addr@host>" use as-is
  if (envFrom) {
    if (envFrom.includes('@')) return envFrom
    // Looks like only a display name was provided (or something like "Book Love <>")
    // Fall back to structured object to avoid "<>"
    return { name: envFrom.replace(/[<>]/g, ''), address }
  }
  return { name, address }
}

export async function sendMail(to: string, subject: string, html: string) {
  const from = resolveFrom()
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    })
    await transporter.sendMail({ to, from, subject, html })
  } catch {
    console.log(`[DEV] Mail to ${to}: ${subject}`)
  }
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const subject = 'Şifre Sıfırlama'
  const html = `<p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla:</p><p><a href="${link}">${link}</a></p><p>Bu bağlantı 1 saat içinde geçerlidir.</p>`
  await sendMail(to, subject, html)
}
