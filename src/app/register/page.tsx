// src/app/register/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/ui/modal'

const TERMS_TEXT = `İşbu Kullanım Koşulları, Gerekli Kitaplar Yayıncılık Ltd. Şti.  (bundan böyle "Boook Love" olarak anılacaktır) tarafından www.boook.love internet adresinden işletilmekte olan internet sitesinin (bundan böyle "Site" olarak anılacaktır) kullanılmasına ilişkin hüküm ve koşulları kapsamaktadır.

Bu siteye girmeniz veya bu sitedeki herhangi bir bilgiyi kullanmanız aşağıdaki koşulları kabul ettiğiniz anlamına gelir.

Bu siteye girilmesi, sitenin ya da sitedeki bilgilerin ve diğer verilerin programların vb. kullanılması sebebiyle, sözleşmenin ihlali, haksız fiil, ya da başkaca sebeplere binaen, doğabilecek doğrudan ya da dolaylı hiçbir zarardan Boook Love sorumlu değildir. Boook Love, sözleşmenin ihlali, haksız fiil, ihmal veya diğer sebepler neticesinde; işlemin kesintiye uğraması, hata, ihmal, kesinti hususunda herhangi bir sorumluluk kabul etmez.

Boook Love işbu site ve site uzantısında mevcut her tür hizmet, ürün, siteyi kullanma koşulları ile sitede sunulan bilgileri önceden bir ihtara gerek olmaksızın değiştirme, siteyi yeniden organize etme, yayını durdurma hakkını saklı tutar. Değişiklikler sitede yayım anında yürürlüğe girer. Sitenin kullanımı ya da siteye giriş ile bu değişiklikler de kabul edilmiş sayılır. Bu koşullar link verilen diğer web sayfaları için de geçerlidir.

Boook Love, sözleşmenin ihlali, haksız fiil, ihmal veya diğer sebepler neticesinde; işlemin kesintiye uğraması, hata, ihmal, kesinti, silinme, kayıp, işlemin veya iletişimin gecikmesi, bilgisayar virüsü, iletişim hatası, hırsızlık, imha veya izinsiz olarak kayıtlara girilmesi, değiştirilmesi veya kullanılması hususunda herhangi bir sorumluluk kabul etmez.

Bu internet sitesi Boook Love'ın kontrolü altında olmayan başka internet sitelerine bağlantı veya referans içerebilir. Boook Love, bu sitelerin içerikleri veya içerdikleri diğer bağlantılardan sorumlu değildir.

Boook Love, bu internet sitesinin genel görünüm ve tasarımı ile internet sitesindeki bütün bilgi, resim, Boook Love markası ve diğer markalar, www.boook.love alan adı, logo, ikon, demonstratif, yazılı, elektronik, grafik veya makinede okunabilir şekilde sunulan teknik veriler, bilgisayar yazılımları, uygulanan satış sistemi, iş metodu ve iş modeli de dahil bütün materyallerin ("Materyaller") ve bunlara ilişkin fikri ve sınai mülkiyet haklarının sahibi veya lisans sahibidir ve yasal koruma altındadır. Internet sitesinde bulunan hiçbir Materyal; önceden izin alınmadan ve kaynak gösterilmeden, kod ve yazılım da dahil olmak üzere, değiştirilemez, kopyalanamaz, çoğaltılamaz, başka bir lisana çevrilemez, yeniden yayımlanamaz, başka bir bilgisayara yüklenemez, postalanamaz, iletilemez, sunulamaz ya da dağıtılamaz. Internet sitesinin bütünü veya bir kısmı başka bir internet sitesinde izinsiz olarak kullanılamaz. Aksine hareketler hukuki ve cezai sorumluluğu gerektirir. Boook Love'ın burada açıkça belirtilmeyen diğer tüm hakları saklıdır.

Boook Love, dilediği zaman bu yasal uyarı sayfasının içeriğini güncelleme yetkisini saklı tutmaktadır ve kullanıcılarına siteye her girişte yasal uyarı sayfasını ziyaret etmelerini tavsiye etmektedir.

Site’nin her türlü kullanımı işbu Kullanım Koşulları’na tabi olup, Kullanım Koşulları Site’nin kullanımı ile birlikte bağlayıcı addedilecektir. Kullanım Koşulları’nı kabul etmeyen kullanıcılar, Site’yi kullanmamalıdır.

Müşteri (son kullanıcı), ödeme yöntemine, üyeliğine ve siparişine ilişkin bilgilerin, ödemenin gerçekleştirilebilmesi ve ödeme usulsüzlüklerinin önlenmesi, araştırılması ve tespit edilmesini temin amacıyla iyzico Ödeme Hizmetleri A.Ş.’ye aktarılmasına ve iyzico tarafından https://www.iyzico.com/gizlilik-politikasi/ adresindeki Gizlilik Politikası’nın en güncel halinde açıklandığı şekilde işlenmesine ve saklanmasına rıza göstermektedir.

Uyuşmazlıkların Çözümü ve Yetkili Mahkeme

Kullanım Koşulları ile ilgili olarak çıkabilecek bütün uyuşmazlıklarda Türkiye Cumhuriyeti Kanunları uygulanacaktır. Kullanım Koşulları’nın uygulanmasından kaynaklanan uyuşmazlıkların çözümünde İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.

Bilgilerinize sunarız.

Gerekli Kitaplar Yayıncılık Ltd. Şti.`;

const KVKK_TEXT = `Kişisel Veriler Kanunu hakkında genel bilgilendirme

6698 Sayılı Kişisel Verilerin Korunması Kanunu (bundan sonra KVKK olarak anılacaktır) 24 Mart 2016 tarihinde kabul edilmiş, 7 Nisan 2016 tarihli 29677 sayılı Resmi Gazete’de yayınlanmıştır. KVKK’nun bir kısmı yayın tarihinde, bir kısmı ise 7 Ekim 2016’da yürürlüğe girmiştir.

Veri sorumlusu sıfatıyla bilgilendirme

6698 sayılı KVKK uyarınca ve Veri Sorumlusu sıfatıyla, kişisel verileriniz bu sayfada açıklandığı çerçevede; kaydedilecek, saklanacak, güncellenecek, mevzuatın izin verdiği durumlarda 3. kişilere açıklanabilecek / devredilebilecek, sınıflandırılabilecek ve KVKK’da sayılan şekillerde işlenebilecektir.

Kişisel verilerinizin ne şekilde işlenebileceği

6698 sayılı KVKK uyarınca, Firmamız ile paylaştığınız kişisel verileriniz, tamamen veya kısmen, otomatik olarak, veyahut herhangi bir veri kayıt sisteminin parçası olmak kaydıyla otomatik olmayan yollarla elde edilerek, kaydedilerek, depolanarak, değiştirilerek, yeniden düzenlenerek, kısacası veriler üzerinde gerçekleştirilen her türlü işleme konu olarak tarafımızdan işlenebilecektir. KVKK kapsamında veriler üzerinde gerçekleştirilen her türlü işlem “kişisel verilerin işlenmesi” olarak kabul edilmektedir.

Kişisel verilerinizin işlenme amaçları ve hukuki sebepleri

Paylaştığınız kişisel veriler,

Müşterilerimize verdiğimiz hizmetlerin gereklerini, sözleşmenin ve teknolojinin gereklerine uygun şekilde yapabilmek, sunulan ürün ve hizmetlerimizi geliştirebilmek için;

6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile bu düzenlemelere dayanak yapılarak hazırlanan 26.08.2015 tarihli 29457 sayılı RG’de yayınlanan Elektronik Ticarette Hizmet Sağlayıcı ve Aracı Hizmet Sağlayıcılar Hakkında Yönetmelik, 27.11.2014 tarihli ve 29188 sayılı RG’de yayınlanan Mesafeli Sözleşmeler Yönetmeliği ve diğer ilgili mevzuat kapsamında işlem sahibinin bilgilerini tespit için kimlik, adres ve diğer gerekli bilgileri kaydetmek için;

Bankacılık ve Elektronik Ödeme alanında zorunlu olan ödeme sistemleri, elektronik sözleşme veya kağıt ortamında işleme dayanak olacak tüm kayıt ve belgeleri düzenlemek; mevzuat gereği ve diğer otoritelerce öngörülen bilgi saklama, raporlama, bilgilendirme yükümlülüklerine uymak için;

Kamu güvenliğine ilişkin hususlarda ve hukuki uyuşmazlıklarda, talep halinde ve mevzuat gereği savcılıklara, mahkemelere ve ilgili kamu görevlilerine bilgi verebilmek için;

6698 sayılı KVKK ve ilgili ikincil düzenlemelere uygun olarak işlenecektir.

Kişisel verilerinizin aktarılabileceği üçüncü kişi veya kuruluşlar hakkında bilgilendirme

Yukarıda belirtilen amaçlarla, Firmamız ile paylaştığınız kişisel verilerinizin aktarılabileceği kişi / kuruluşlar; başta Firmamızın e-ticaret altyapısını sağlayan IdeaSoft Yazılım San. ve Tic. A.Ş. olmak üzere, tedarikçiler, kargo şirketleri gibi sunulan hizmetler ile ilgili kişi ve kuruluşlar, faaliyetlerimizi yürütmek üzere ve/veya Veri İşleyen sıfatı ile hizmet alınan, iş birliği yaptığımız program ortağı kuruluşları, yurtiçi / yurtdışı kuruluşlar ve diğer 3. kişilerdir.

Müşteri (son kullanıcı), ödeme yöntemine, üyeliğine ve siparişine ilişkin bilgilerin, ödemenin gerçekleştirilebilmesi ve ödeme usulsüzlüklerinin önlenmesi, araştırılması ve tespit edilmesini temin amacıyla iyzico Ödeme Hizmetleri A.Ş.’ye aktarılmasına ve iyzico tarafından https://www.iyzico.com/gizlilik-politikasi/ adresindeki Gizlilik Politikası’nın en güncel halinde açıklandığı şekilde işlenmesine ve saklanmasına rıza göstermektedir.

Kişisel verilerinizin toplanma şekli

Kişisel verileriniz,

Firmamız internet sitesi ve mobil uygulamalarındaki formlar aracılığıyla ad, soyad, TC kimlik numarası, adres, telefon, iş veya özel e-posta adresi gibi bilgiler ile; kullanıcı adı ve şifresi kullanılarak giriş yapılan sayfalardaki tercihleri, gerçekleştirilen işlemlerin IP kayıtları, tarayıcı tarafından toplanan çerez verileri ile gezinme süre ve detaylarını içeren veriler, konum verileri şeklinde;

Satış ve pazarlama departmanı çalışanlarımız, şubelerimiz, tedarikçilerimiz, diğer satış kanalları, kağıt üzerindeki formlar, kartvizitler, dijital pazarlama ve çağrı merkezi gibi kanallarımız aracılığıyla sözlü, yazılı veya elektronik ortamdan;

Firmamız ile ticari ilişki kurmak, iş başvurusu yapmak, teklif vermek gibi amaçlarla, kartvizit, özgeçmiş (cv), teklif vermek ve sair yollarla kişisel verilerini paylaşan kişilerden alınan, fiziki veya sanal bir ortamda, yüz yüze ya da mesafeli, sözlü veya yazılı ya da elektronik ortamdan;

Ayrıca farklı kanallardan dolaylı yoldan elde edilen, web sitesi, blog, yarışma, anket, oyun, kampanya ve benzeri amaçlı kullanılan (mikro) web sitelerinden ve sosyal medyadan elde edilen veriler, e-bülten okuma veya tıklama hareketleri, kamuya açık veri tabanlarının sunduğu veriler, sosyal medya platformlarından paylaşıma açık profil ve verilerden;

işlenebilmekte ve toplanabilmektedir.

KVKK yürürlüğe girmeden önce elde edilen kişisel verileriniz

KVKK’nun yürürlük tarihi olan 7 Nisan 2016 tarihinden önce, üyelik, elektronik ileti izni, ürün / hizmet satın alma ve diğer şekillerde hukuka uygun olarak elde edilmiş olan kişisel verileriniz de bu belgede düzenlenen şart ve koşullara uygun olarak işlenmekte ve muhafaza edilmektedir.

Kişisel verilerinizin yurt dışına aktarılması

Türkiye’de işlenerek veya Türkiye dışında işlenip muhafaza edilmek üzere, yukarıda sayılan yöntemlerden herhangi birisi ile toplanmış kişisel verileriniz KVKK kapsamında kalmak kaydıyla ve sözleşme amaçlarına uygun olarak yurtdışında bulunan (Kişisel Veriler Kurulu tarafından akredite edilen ve kişisel verilerin korunması hususunda yeterli korumanın bulunduğu ülkelere) hizmet aracılarına da aktarılabilecektir.

Kişisel verilerin saklanması ve korunması

Kişisel verileriniz, Firmamız nezdinde yer alan veri tabanında ve sistemlerde KVKK’nun 12. maddesi gereğince gizli olarak saklanacak; yasal zorunluluklar ve bu belgede belirtilen düzenlemeler haricinde hiçbir şekilde üçüncü kişilerle paylaşılmayacaktır.

Firmamız, kişisel verilerinizin barındığı sistemleri ve veri tabanlarını, KVKK’nun 12. Maddesi gereği kişisel verilerin hukuka aykırı olarak işlenmesini önlemekle, yetkisiz kişilerin erişimlerini engellemekle, erişim yönetimi gibi yazılımsal tedbirleri ve fiziksel güvenlik önlemleri almakla mükelleftir.

Kişisel verilerin yasal olmayan yollarla başkaları tarafından elde edilmesinin öğrenilmesi halinde durum derhal, yasal düzenlemeye uygun ve yazılı olarak Kişisel Verileri Koruma Kurulu’na bildirilecektir.

Kişisel verilerin güncel ve doğru tutulması

KVKK’nun 4. maddesi uyarınca Firmamızın kişisel verilerinizi doğru ve güncel olarak tutma yükümlülüğü bulunmaktadır. Bu kapsamda Firmamızın yürürlükteki mevzuattan doğan yükümlülüklerini yerine getirebilmesi için Müşterilerimizin doğru ve güncel verilerini paylaşması veya web sitesi / mobil uygulama üzerinden güncellemesi gerekmektedir.

6698 sayılı KVKK uyarınca kişisel veri sahibinin hakları

6698 sayılı KVKK 11.maddesi 7 Ekim 2016 tarihinde yürürlüğe girmiş olup ilgili madde gereğince, Kişisel Veri Sahibi’nin bu tarihten sonraki hakları aşağıdaki gibidir:

Kişisel Veri Sahibi, Firmamıza (veri sorumlusu) başvurarak kendisiyle ilgili;

Kişisel veri işlenip işlenmediğini öğrenme,

Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,

Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,

Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,

Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,

KVKK’nun 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme,

Kişisel verilerin düzeltilmesi, silinmesi, yok edilmesi halinde bu işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere de bildirilmesini isteme,

İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,

Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme,

haklarına sahiptir.

İstanbul Ticaret Odası’nın 205813 sicil sayısında kayıtlı, 039409931190001 MERSİS numarasına sahip, Rasimpaşa Mah. Elmalıçeşme Sok. No: 23/8 Kadıköy / İstanbul adresinde mukim Gerekli Kitaplar Yayıncılık Ltd. Şti. , KVKK kapsamında Veri Sorumlusu’dur.

Firmamız tarafından atanacak Veri Sorumlusu Temsilcisi, yasal altyapı sağlandığında Veri Sorumluları Sicilinde ve bu belgenin bulunduğu internet adresinde ilan edilecektir.

Kişisel Veri Sahipleri, sorularını, görüşlerini veya taleplerini aşağıdaki iletişim kanallarından herhangi birisine yöneltebilir:

E-posta: info@boook.love
KEP: gereklikitaplar@hs01.kep.tr
Telefon: 0 (541) 788 94 98

Bilgilerinize sunarız.
Gerekli Kitaplar Yayıncılık Ltd. Şti.`;

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeKvkk, setAgreeKvkk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [openTerms, setOpenTerms] = useState(false)
  const [openKvkk, setOpenKvkk] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setMsg(null)

    if (!agreeKvkk || !agreeTerms) {
      setErr('Kayıt için “Kullanım Koşulları” ve “Kişisel Veriler Kanunu” metinlerini onaylamanız gerekir.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const j = await res.json()
      if (!res.ok || !j?.ok) {
        setErr(j?.message || 'Kayıt başarısız.')
        return
      }
      setMsg('Kayıt başarılı! Artık giriş yapabilirsiniz.')
    } catch {
      setErr('Sunucuya ulaşılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">Kayıt Ol</h1>
      <p className="text-sm text-gray-500 mb-6">
        Zaten hesabın var mı?{' '}
        <Link className="text-rose-600 hover:underline" href="/login">
          Giriş yap
        </Link>
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ad Soyad</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="Ad Soyad"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">E-posta</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="ornek@boook.love"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Şifre</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="En az 6 karakter"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border"
              checked={agreeKvkk}
              onChange={(e) => setAgreeKvkk(e.target.checked)}
              required
            />
            <span className="text-sm">
              <button
                type="button"
                className="text-rose-600 underline underline-offset-4"
                onClick={() => setOpenKvkk(true)}
              >
                Kişisel Veriler Kanunu (KVKK)
              </button>{' '}
              metnini okudum ve onaylıyorum.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 rounded border"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <span className="text-sm">
              <button
                type="button"
                className="text-rose-600 underline underline-offset-4"
                onClick={() => setOpenTerms(true)}
              >
                Kullanım Koşulları
              </button>{' '}
              metnini okudum ve onaylıyorum.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-rose-600 text-white py-2.5 font-medium hover:bg-rose-700 disabled:opacity-60"
        >
          {submitting ? 'Kayıt yapılıyor…' : 'Kayıt ol'}
        </button>

        {err && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3">
            {err}
          </div>
        )}
        {msg && !err && (
          <div className="rounded-lg bg-green-50 text-green-700 px-4 py-3">
            {msg} — <Link href="/login" className="underline underline-offset-4">Girişe git</Link>
          </div>
        )}
      </form>

      {/* KVKK Modal */}
      <Modal open={openKvkk} onClose={() => setOpenKvkk(false)} title="Kişisel Veriler Kanunu (KVKK)">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{KVKK_TEXT}</div>
      </Modal>

      {/* Terms Modal */}
      <Modal open={openTerms} onClose={() => setOpenTerms(false)} title="Kullanım Koşulları">
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{TERMS_TEXT}</div>
      </Modal>
    </div>
  )
}
