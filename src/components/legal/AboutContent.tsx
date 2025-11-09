export default function AboutContent() {
  return (
    <article className="not-prose">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-[15px] leading-7 text-neutral-800">
          <strong>Book Love</strong>, kitap kulüplerini tek bir çatı altında toplayarak okurları buluşturan bir
          platformdur. Amacımız, insanların düzenli olarak kitap okumalarını teşvik etmek ve ortak bir okuma
          deneyimiyle güçlü bir kültürel topluluk oluşturmaktır.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-rose-200/70 bg-rose-50 p-4">
            <h3 className="font-semibold">Ne yapabilirsin?</h3>
            <ul className="mt-2 list-disc pl-5 text-[15px] text-neutral-800">
              <li>Dilediğin <strong>kitap kulübüne</strong> üye ol</li>
              <li><strong>Book Buddy</strong>’ler edin, onlarla mesajlaş</li>
              <li>Profilini oluştur; kitap, film, resim ve sanat üzerine yorum paylaş</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-4">
            <h3 className="font-semibold">Duruşumuz</h3>
            <p className="mt-2 text-[15px] text-neutral-800">
              Book Love bir <strong>kültür platformudur</strong>. Cinsiyetçi, ırkçı, homofobik veya saldırgan
              paylaşımlara yer yoktur. Herkesin kendini güvende hissettiği bir alan için özen gösteririz.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-sky-200/70 bg-sky-50 p-4">
          <blockquote className="text-[15px] leading-7 text-neutral-800">
            “Okumak yalnızca bireysel bir eylem değil; paylaşıldıkça büyüyen bir <strong>ortak deneyim</strong>dir.
            Birlikte okumak, birlikte düşünmek, birlikte güçlenmek için buradayız.”
          </blockquote>
        </div>
      </div>
    </article>
  )
}
