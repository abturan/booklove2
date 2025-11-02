// src/lib/emailTemplates.ts

const brandColor = '#fa3d30'
const gray = '#f6f7f9'
const text = '#111827'

export function renderEmail({
  title,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}) {
  const cta = ctaLabel && ctaUrl
    ? `<p style="margin:24px 0 0 0;"><a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;background:${brandColor};color:white;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(ctaLabel)}</a></p>`
    : ''

  return `<!doctype html>
  <html lang="tr">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:${gray};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${text}">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:white;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden">
        <div style="background:${brandColor};color:white;padding:16px 20px;font-size:18px;font-weight:800;letter-spacing:.3px">
          boook.love
        </div>
        <div style="padding:20px">
          <h1 style="margin:0 0 8px 0;font-size:20px">${escapeHtml(title)}</h1>
          <div style="margin-top:8px;font-size:15px;line-height:1.6">${bodyHtml}</div>
          ${cta}
          <p style="margin:24px 0 0 0;font-size:12px;color:#6b7280">Bu e-posta bilgilendirme amaçlı gönderildi. Yanıtlamayın.</p>
        </div>
      </div>
    </div>
  </body>
  </html>`
}

export function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
