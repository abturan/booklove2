import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <p className="text-neutral-600">© {new Date().getFullYear()} bo❤️ok.love — Tüm hakları saklıdır.</p>
        <nav className="flex items-center gap-5">
          <Link href="/about" className="text-neutral-600 hover:text-black">Hakkında</Link>
          <Link href="/privacy" className="text-neutral-600 hover:text-black">Gizlilik</Link>
          <Link href="/contact" className="text-neutral-600 hover:text-black">İletişim</Link>
        </nav>
      </div>
    </footer>
  );
}
