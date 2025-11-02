// src/lib/mail.ts
export async function sendMail(to: string, subject: string, html: string) {
  const from = process.env.MAIL_FROM || 'no-reply@example.com'
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
