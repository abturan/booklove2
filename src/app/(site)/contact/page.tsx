export const metadata = { title: 'İletişim — bo❤️ok.love' };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 prose prose-neutral">
      <h1>İletişim</h1>
      <p>Öneri, geri bildirim veya iş birlikleri için bize yazın:</p>
      <ul>
        <li>E-posta: <a href="mailto:info@book.love">hello@book.love</a></li>
        <li>X / Twitter: <a href="https://x.com/" target="_blank">/booklove</a></li>
      </ul>
      <p>Mesajlar genelde 48 saat içinde yanıtlanır.</p>
    </main>
  );
}
