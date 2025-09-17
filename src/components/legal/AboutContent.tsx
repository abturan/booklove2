// src/components/legal/AboutContent.tsx
export default function AboutContent() {
  return (
    <article className="prose prose-neutral prose-lg leading-[1.9] max-w-none prose-p:my-4 prose-li:my-2.5 prose-headings:mt-6 prose-headings:mb-2">
      <h3 className="font-bold">Biz Kimiz?</h3>
      <p>
        <strong>boook.love</strong>, okurları bir araya getiren <strong>kitap kulüpleri için çatı bir platform</strong>dur.
        Yazarların ve moderatörlerin hazırladığı seçkiler, düzenli buluşmalar ve sohbetlerle okuma yolculuğunu
        daha keyifli, paylaşılabilir ve sürdürülebilir kılar.
      </p>

      <h3 className="font-bold">Ne Sunuyoruz?</h3>
      <p>
        boook.love’da her kulüp kendi kimliğine sahiptir: tema, aylık seçki, buluşma takvimi ve topluluk kuralları.
        Siz sadece katılır, okur ve sohbet edersiniz. Programı biz kurarız, ritmi topluluk belirler.
      </p>
      <ul>
        <li><strong>Kulüpler:</strong> Farklı tür ve temalarda yaşayan okur toplulukları.</li>
        <li><strong>Canlı Buluşmalar:</strong> Moderatörlü oturumlar, soru–cevaplar, özel etkinlikler.</li>
        <li><strong>Seçkiler &amp; Planlar:</strong> Aylık okuma önerileri ve takip etmesi kolay akışlar.</li>
        <li><strong>Adil Üyelik:</strong> Şeffaflık, iptal kolaylığı ve sürekli geri bildirim.</li>
      </ul>

      <h3 className="font-bold">Amacımız</h3>
      <p>
        Düzenli okumayı yeniden alışkanlığa dönüştürmek, keşifleri çoğaltmak ve benzer ilgi alanlarına sahip
        insanları güvenli bir toplulukta buluşturmak. Özetle, okuma kültürünü <strong>sürdürülebilir</strong> kılmak.
      </p>

      <h3 className="font-bold">İletişim</h3>
      <p>
        Bize dilediğiniz zaman <a href="/iletisim">iletişim formumuz</a> üzerinden ulaşabilirsiniz.
        Takım e-postamız: <strong>info@boook.love</strong>
      </p>
    </article>
  )
}
