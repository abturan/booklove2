// src/components/Footer.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand + tagline */}
        <div className="space-y-3">
          <div className="text-lg font-semibold tracking-tight">boook.love</div>
          <p className="text-sm text-neutral-600">
            Okurları; kulüpler, seçkiler ve moderatörlü sohbetlerle bir araya getiren kitap kulübü platformu.
          </p>
          <p className="text-xs text-neutral-500">© {year} boook.love — Tüm hakları saklıdır.</p>
        </div>

        {/* Navigation */}
        <nav className="md:justify-center flex flex-col space-y-2 text-sm">
          <Link href="/hakkimizda" scroll={false} className="hover:text-black text-neutral-700">
            Hakkımızda
          </Link>
          <Link href="/mesafeli-satis-sozlesmesi" scroll={false} className="hover:text-black text-neutral-700">
            Mesafeli Satış Sözleşmesi
          </Link>
          <Link href="/gizlilik-sozlesmesi" scroll={false} className="hover:text-black text-neutral-700">
            Gizlilik Sözleşmesi
          </Link>
          <Link href="/iletisim" className="hover:text-black text-neutral-700">
            İletişim
          </Link>
        </nav>

        {/* Payments */}
        <div className="md:justify-end flex flex-col items-start md:items-end gap-3">
          <span className="text-xs uppercase tracking-wide text-neutral-500">Güvenli Ödeme</span>
          <div className="flex items-center gap-4">
            <Image className="opacity-80 grayscale hover:opacity-100 transition" src="/logos/visa.svg" alt="Visa" width={68} height={28} />
            <Image className="opacity-80 grayscale hover:opacity-100 transition" src="/logos/mastercard.svg" alt="Mastercard" width={96} height={28} />
            <Image className="opacity-80 grayscale hover:opacity-100 transition" src="/logos/paytr.png" alt="Paytr ile Öde" width={116} height={28} />
          </div>
        </div>
      </div>
    </footer>
  )
}
