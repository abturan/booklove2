// src/lib/sms.ts
export async function sendSms(to: string, body: string) {
  const provider = (process.env.SMS_PROVIDER || '').trim().replace(/[,;]+$/,'').toLowerCase()
  if (provider === 'twilio') {
    const sid = (process.env.TWILIO_SID || '').trim().replace(/^['"]|['"]$/g, '')
    const token = (process.env.TWILIO_TOKEN || '').trim().replace(/^['"]|['"]$/g, '')
    const fromRaw = (process.env.TWILIO_FROM || '').trim().replace(/^['"]|['"]$/g, '')
    if (!sid || !token || !fromRaw) throw new Error('Twilio credentials missing')
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const creds = Buffer.from(`${sid}:${token}`).toString('base64')
    const form = new URLSearchParams()
    form.append('To', to)
    form.append('Body', body)
    if (/^MG[a-fA-F0-9]{24}$/i.test(fromRaw)) {
      // Messaging Service SID
      form.append('MessagingServiceSid', fromRaw)
    } else {
      form.append('From', fromRaw)
    }
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Basic ${creds}` }, body: form })
    if (!res.ok) {
      let reason = 'Twilio send failed'
      try {
        const j = await res.json()
        if (j?.message) reason = `Twilio: ${j.message}`
      } catch {}
      throw new Error(reason)
    }
    return true
  }
  console.log(`[DEV] SMS to ${to}: ${body}`)
  return true
}
