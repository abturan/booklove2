// src/lib/parasut.ts
import { alertError, adminAlert } from '@/lib/adminAlert'

type ParasutEnv = {
  baseUrl: string
  clientId: string
  clientSecret: string
  username: string
  password: string
  companyId: string
  defaultVatRate: number
  defaultCurrency: string
  defaultProductId?: string | null
  defaultProductName?: string | null
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null

export function isParasutEnabled(): boolean {
  const v = (process.env.PARASUT_ENABLED || '0').toString().toLowerCase().trim()
  return v === '1' || v === 'true' || v === 'yes' || v === 'on'
}

export function getParasutEnv(): ParasutEnv | null {
  if (!isParasutEnabled()) return null
  const {
    PARASUT_BASE_URL,
    PARASUT_CLIENT_ID,
    PARASUT_CLIENT_SECRET,
    PARASUT_USERNAME,
    PARASUT_PASSWORD,
    PARASUT_COMPANY_ID,
    PARASUT_DEFAULT_VAT_RATE,
    PARASUT_DEFAULT_CURRENCY,
    PARASUT_DEFAULT_PRODUCT_ID,
    PARASUT_DEFAULT_PRODUCT_NAME,
  } = process.env

  if (!PARASUT_BASE_URL || !PARASUT_CLIENT_ID || !PARASUT_CLIENT_SECRET || !PARASUT_USERNAME || !PARASUT_PASSWORD || !PARASUT_COMPANY_ID) {
    return null
  }

  const defaultVat = Number(PARASUT_DEFAULT_VAT_RATE || '0')
  const currency = (PARASUT_DEFAULT_CURRENCY || 'TRY').toUpperCase()

  const allowedCurrencies = new Set(['TRY', 'TRL', 'USD', 'EUR', 'GBP'])
  if (!allowedCurrencies.has(currency)) {
    throw new Error(`Parasut invalid currency: ${currency}`)
  }

  return {
    baseUrl: PARASUT_BASE_URL.replace(/\/$/, ''),
    clientId: PARASUT_CLIENT_ID,
    clientSecret: PARASUT_CLIENT_SECRET,
    username: PARASUT_USERNAME,
    password: PARASUT_PASSWORD,
    companyId: PARASUT_COMPANY_ID,
    defaultVatRate: Number.isFinite(defaultVat) ? defaultVat : 0,
    defaultCurrency: currency,
    defaultProductId: PARASUT_DEFAULT_PRODUCT_ID || null,
    defaultProductName: PARASUT_DEFAULT_PRODUCT_NAME || null,
  }
}

async function getAccessToken(env: ParasutEnv): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - 5000 > now) {
    return cachedToken.accessToken
  }
  const form = new URLSearchParams({
    grant_type: 'password',
    username: env.username,
    password: env.password,
    client_id: env.clientId,
    client_secret: env.clientSecret,
  })
  const res = await fetch(`${env.baseUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    cache: 'no-store',
  })
  if (!res.ok) {
    const t = await safeText(res)
    throw new Error(`Parasut auth failed: ${res.status} ${t}`)
  }
  const j: any = await res.json()
  const accessToken = String(j.access_token || '')
  const expiresIn = Number(j.expires_in || 3600)
  if (!accessToken) throw new Error('Parasut access_token missing')
  cachedToken = { accessToken, expiresAt: now + expiresIn * 1000 }
  return accessToken
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'content-type': 'application/json' }
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text()
    return t.slice(0, 800)
  } catch {
    return ''
  }
}

export type InvoiceContactInput = {
  name: string
  email?: string | null
  taxNumber?: string | null
}

export type InvoiceLineInput = {
  description: string
  quantity: number
  unitPrice: number // in major currency unit, e.g. 99.9
  vatRate?: number // 0, 1, 10, 20
  productId?: string
  productName?: string
}

export type CreateInvoiceInput = {
  merchantOid: string
  issueDate?: string // YYYY-MM-DD
  currency?: string // TRL, USD, EUR ...
  contact: InvoiceContactInput
  lines: InvoiceLineInput[]
}

export async function createSalesInvoice(input: CreateInvoiceInput): Promise<{ id: string } | null> {
  const env = getParasutEnv()
  if (!env) {
    // Disabled or incomplete ENV → silently skip
    return null
  }

  try {
    const token = await getAccessToken(env)
    // 1) Create or reuse a contact
    const contactId = await createContact({ env, token, contact: input.contact })
    const defaultProductId = env.defaultProductId || undefined
    const defaultProductName = env.defaultProductName || 'Book Love Etkinlik'

    // 2) Build JSON:API sales invoice payload
    const issueDate = input.issueDate || new Date().toISOString().slice(0, 10)
    const initialCurrency = (input.currency || env.defaultCurrency).toUpperCase()
    if (!['TRY', 'TRL', 'USD', 'EUR', 'GBP'].includes(initialCurrency)) {
      throw new Error(`Parasut invalid currency: ${initialCurrency}`)
    }
    const currency = initialCurrency === 'TRY' ? 'TRL' : initialCurrency
    const toFixed = (value: number) => value.toFixed(2)

    const details = input.lines.map((l) => {
      const productId = l.productId || defaultProductId
      const productName = l.productName || defaultProductName
      const detail: any = {
        type: 'sales_invoice_details',
        attributes: {
          quantity: toFixed(l.quantity ?? 1),
          unit_price: toFixed(l.unitPrice),
          vat_rate: Number.isFinite(l.vatRate as number) ? l.vatRate : env.defaultVatRate,
          description: l.description,
          unit: 'Adet',
          product_name: productName,
        },
      }
      if (productId) {
        detail.relationships = {
          product: { data: { type: 'products', id: productId } },
        }
      }
      return detail
    })

    const body = {
      data: {
        type: 'sales_invoices',
        attributes: {
          item_type: 'invoice',
          issue_date: issueDate,
          description: `Ödeme ${input.merchantOid}`,
          ...(currency !== 'TRL' ? { currency } : {}),
        },
        relationships: {
          contact: { data: { type: 'contacts', id: contactId } },
          details: { data: details },
        },
      },
    }

    const res = await fetch(`${env.baseUrl}/v4/${env.companyId}/sales_invoices`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const t = await safeText(res)
      throw new Error(`Parasut invoice failed: ${res.status} ${t}`)
    }
    const j: any = await res.json()
    const id = String(j?.data?.id || '')
    await adminAlert('Parasut fatura oluşturuldu', { oid: input.merchantOid, invoiceId: id })
    return id ? { id } : null
  } catch (err) {
    await alertError('parasut_create_invoice', err, { oid: input.merchantOid })
    return null
  }
}

async function createContact(args: { env: ParasutEnv; token: string; contact: InvoiceContactInput }): Promise<string> {
  const { env, token, contact } = args

  // Minimal contact payload. Parasut allows creating contacts with only name; include email when available.
  const body = {
    data: {
      type: 'contacts',
      attributes: {
        name: contact.name || 'Müşteri',
        email: contact.email || undefined,
        tax_number: contact.taxNumber || undefined,
        contact_type: 'person',
        account_type: 'customer',
      },
    },
  }
  const res = await fetch(`${env.baseUrl}/v4/${env.companyId}/contacts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    // If contact creation fails (e.g., duplicate), try a naive fallback to list last page and pick first matching email.
    const t = await safeText(res)
    throw new Error(`Parasut contact failed: ${res.status} ${t}`)
  }
  const j: any = await res.json()
  const id = String(j?.data?.id || '')
  if (!id) throw new Error('Parasut contact id missing')
  return id
}

// Convenience helper for PayTR success → single line invoice
export async function createInvoiceForPaytr(args: {
  merchantOid: string
  buyerName: string
  buyerEmail?: string | null
  description: string
  amountTRY: number // major unit, e.g., 99.9
  vatRate?: number
}) {
  const { merchantOid, buyerName, buyerEmail, description, amountTRY, vatRate } = args
  const input: CreateInvoiceInput = {
    merchantOid,
    contact: { name: buyerName, email: buyerEmail || undefined },
    lines: [
      {
        description,
        quantity: 1,
        unitPrice: Number(amountTRY.toFixed(2)),
        vatRate: typeof vatRate === 'number' ? vatRate : undefined,
        productName: 'Book Love Etkinlik',
      },
    ],
  }
  return createSalesInvoice(input)
}
