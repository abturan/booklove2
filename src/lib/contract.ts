export type ContractData = {
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  city: string
  district: string
  priceTRY: number
  startDateISO: string
}

function fmtDateTR(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(iso))
}

// HTML — (mevcut tam metin sürümü, değişmedi)
export function buildContractHtml(d: ContractData) {
  const tarih = fmtDateTR(d.startDateISO)
  const name = escapeHtml(d.buyerName)
  const addr = `${escapeHtml(d.city)} / ${escapeHtml(d.district)}`
  const phone = escapeHtml(d.buyerPhone)
  const email = escapeHtml(d.buyerEmail)

  return `
  <style>
    .c-root { font-size:14px; line-height:1.6; color:#111; }
    .c-root h2 { font-size:18px; font-weight:700; margin:20px 0 10px; }
    .c-root h3 { font-size:16px; font-weight:700; margin:14px 0 6px; }
    .c-root p  { margin:8px 0; }
    .c-root ul { margin:8px 0 8px 18px; list-style: disc; }
    .kv p { margin:4px 0; }
    .muted { color:#555; }
    .hr { height:1px; background:#e5e7eb; margin:14px 0; }
    strong { font-weight:700; }
  </style>

  <div class="c-root">
    <h2>MESAFELİ SATIŞ SÖZLEŞMESİ</h2>

    <h2>1. TARAFLAR</h2>
    <p>
      İşbu Mesafeli Satış Sözleşmesi (“Sözleşme”), aşağıda bilgileri yer alan taraflar arasında
      6502 sayılı <strong>Tüketicinin Korunması Hakkında Kanun</strong> ve
      <strong>Mesafeli Sözleşmeler Yönetmeliği</strong> hükümleri çerçevesinde elektronik ortamda kurulmuştur.
    </p>

    <h3>A. ALICI (Sözleşmede “ALICI” olarak anılacaktır)</h3>
    <div class="kv">
      <p><strong>Adı Soyadı / Unvanı:</strong> <strong>${name}</strong></p>
      <p><strong>Adresi:</strong> <strong>${addr}</strong></p>
      <p><strong>Telefon:</strong> <strong>${phone}</strong></p>
      <p><strong>E-posta / Kullanıcı Adı:</strong> <strong>${email}</strong></p>
    </div>

    <h3>B. SATICI (Sözleşmede “ŞİRKET” olarak anılacaktır)</h3>
    <div class="kv">
      <p><strong>Unvan:</strong> Gerekli Kitaplar Yayıncılık Ltd. Şti.</p>
      <p><strong>Adres:</strong> Rasimpaşa Mah. Elmalıçeşme Sok. No: 23/8 Kadıköy/İstanbul</p>
      <p><strong>Telefon:</strong> 0 (541) 788 94 98</p>
      <p><strong>KEP:</strong> gereklikitaplar@hs01.kep.tr</p>
      <p><strong>E-posta:</strong> info@boook.love</p>
    </div>

    <p class="muted">ALICI, işbu Sözleşme’yi elektronik ortamda onayladığında, abonelik bedelini ve varsa ilgili vergileri, seçtiği ödeme planına uygun şekilde ödemeyi peşinen kabul ve taahhüt eder.</p>

    <h2>2. TANIMLAR</h2>
    <p><strong>BAKAN</strong>: Ticaret Bakanı’nı,</p>
    <p><strong>BAKANLIK</strong>: Ticaret Bakanlığı’nı,</p>
    <p><strong>KANUN</strong>: 6502 sayılı Tüketicinin Korunması Hakkında Kanun’u,</p>
    <p><strong>YÖNETMELİK</strong>: Mesafeli Sözleşmeler Yönetmeliği’ni (RG:27.11.2014/29188),</p>
    <p><strong>HİZMET</strong>: SATICI tarafından sunulan, elektronik ortamda çevrimiçi kitap kulübü üyelik/abonelik hizmetini,</p>
    <p><strong>SATICI</strong>: Ticari veya mesleki faaliyetleri kapsamında tüketiciye dijital hizmet sunan gerçek veya tüzel kişiyi,</p>
    <p><strong>ALICI</strong>: Bu hizmeti ticari veya mesleki olmayan amaçlarla edinen, kullanan veya yararlanan gerçek ya da tüzel kişiyi,</p>
    <p><strong>SİTE</strong>: SATICI’ya ait internet sitesini,</p>
    <p><strong>SİPARİŞ VEREN</strong>: Hizmeti SATICI’ya ait internet sitesi üzerinden talep eden gerçek veya tüzel kişiyi,</p>
    <p><strong>SÖZLEŞME</strong>: İşbu Mesafeli Satış Sözleşmesi’ni ifade eder.</p>

    <h2>3. KONU</h2>
    <p>İşbu Sözleşme, ALICI’nın SATICI’ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği <strong>Kitap Kulübü Aboneliği</strong> dijital hizmetinin sunulması ve buna ilişkin hak ve yükümlülüklerin belirlenmesi amacıyla düzenlenmiştir.</p>
    <p>Listelenen ve ilan edilen abonelik bedelleri güncel fiyatları ifade eder; SATICI tarafından güncellenene kadar geçerlidir. Süreli kampanyalarda belirtilen özel fiyatlar sadece kampanya süresi boyunca geçerlidir.</p>

    <h2>4. HİZMETİN TEMEL ÖZELLİKLERİ VE ÜCRET</h2>
    <p><strong>Hizmet Açıklaması:</strong> Kitap Kulübü Aboneliği (çevrimiçi erişim, dijital içerikler ve etkinliklere katılım)</p>
    <p><strong>Ödeme Şekli ve Planı:</strong> Kredi/banka kartı ile aylık tekrarlayan abonelik ödemesi</p>
    <p><strong>Toplam Bedel:</strong> <strong>${d.priceTRY} TL</strong> (KDV dâhil, aylık abonelik bedeli)</p>
    <p><strong>Fatura Teslimi:</strong> E-Arşiv fatura, ALICI’nın e-posta adresine gönderilecektir.</p>
    <p><strong>Abonelik Başlangıç Tarihi:</strong> <strong>${tarih}</strong></p>
    <p><strong>Hizmetin Sunumu:</strong> Dijital ortamda, ALICI’nın SİTE üzerinden oluşturduğu hesabına erişim sağlanması suretiyle</p>

    <h2>5. GENEL HÜKÜMLER</h2>
    <p>ALICI, Sözleşme konusu hizmetin temel nitelikleri, abonelik bedeli, ödeme planı ve kullanım şartları hakkında doğru ve eksiksiz olarak bilgilendirildiğini, elektronik ortamda onay verdiğini kabul ve beyan eder.</p>
    <p>SATICI, hizmeti sözleşmede belirtilen şekilde, zamanında ve eksiksiz sunmayı, ilgili mevzuata uygun hareket etmeyi taahhüt eder.</p>
    <p>ALICI, ödeme yükümlülüğünü yerine getirmediği veya banka kayıtlarında iptal/geri ödeme gerçekleştiği takdirde, SATICI’nın hizmeti sunma yükümlülüğünün sona ereceğini kabul eder.</p>
    <p>Mücbir sebepler nedeniyle hizmetin sunulmasının imkânsızlaştığı hallerde, SATICI durumu derhal ALICI’ya bildirir; bu durumda ALICI sözleşmeyi feshedebilir. Fesih halinde ödenmiş bedeller, ilgili mevzuat çerçevesinde iade edilir.</p>
    <p>SATICI, ALICI’ya ait iletişim bilgileri üzerinden bilgilendirme, kampanya ve pazarlama amaçlı iletişim kurabilir; ALICI bu iletişimlere dilediği zaman son verebilir.</p>
    <p>ALICI, SİTE kullanımında mevzuata ve ahlaka aykırı davranmayacağını, kişisel bilgilerin doğruluğunu taahhüt eder.</p>

    <h2>6. CAYMA HAKKI</h2>
    <p>Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesi uyarınca, dijital içerik veya çevrimiçi hizmet aboneliklerinde, tüketicinin onayı ile hizmetin ifasına başlanması halinde cayma hakkı kullanılamaz. ALICI, işbu sözleşmeyi onaylayarak bu hususta bilgilendirildiğini kabul eder.</p>
    <p>Cayma hakkının kullanılabilmesi için, 14 gün içinde SATICI’ya e-posta veya yazılı bildirim yapılması gerekmektedir. ALICI, aboneliğini dilediği zaman iptal edebilir; iptal sonrası tekrarlı ödeme yapılmaz ve hizmetin ifası başlamadığından bir sonraki ödeme tahsil edilmez.</p>

    <h2>7. TEMERRÜT HALİ VE HUKUKİ SONUÇLARI</h2>
    <p>ALICI’nın ödeme işlemlerini kredi/banka kartı ile yaptığı durumda temerrüde düşmesi halinde, kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu olacağını kabul eder. Bu durumda SATICI, aboneliği durdurma veya feshetme hakkına sahiptir.</p>

    <h2>8. YETKİLİ MAHKEME</h2>
    <p>İşbu Sözleşmeden doğan uyuşmazlıklarda, Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir. 01/01/2025 tarihinden itibaren, 2025 yılı için değeri 149.000 TL’nin altında bulunan uyuşmazlıklar hakkında İl veya İlçe Tüketici Hakem Heyetlerine başvuru yapılabilecektir.</p>

    <h2>9. YÜRÜRLÜK</h2>
    <p>ALICI, SİTE üzerinden abonelik işlemini onayladığında işbu Sözleşme tüm hükümleriyle yürürlüğe girer.</p>

    <div class="hr"></div>
    <p><strong>SATICI:</strong> Gerekli Kitaplar Yayıncılık Ltd. Şti.</p>
    <p><strong>ALICI:</strong> <strong>${name}</strong></p>
    <p><strong>TARİH:</strong> <strong>${tarih}</strong></p>
    <p><strong>MERSİS NO:</strong> 039409931190001</p>
  </div>
  `
}

// ---------- PDF (pdfkit) — font adları parametre olarak gelir ----------
export function renderContractPdf(
  doc: any,
  d: ContractData,
  opts?: { fontRegular?: string; fontBold?: string },
) {
  const R = opts?.fontRegular ?? 'Helvetica'
  const B = opts?.fontBold ?? 'Helvetica-Bold'
  const tarih = fmtDateTR(d.startDateISO)

  const H2 = (t: string) => {
    doc.moveDown(0.6).font(B).fontSize(14).text(t)
    doc.moveDown(0.3).font(R).fontSize(11)
  }
  const H3 = (t: string) => {
    doc.moveDown(0.4).font(B).fontSize(12).text(t)
    doc.moveDown(0.2).font(R).fontSize(11)
  }
  const P = (t: string) => { doc.font(R).text(t, { align: 'left' }).moveDown(0.2) }
  const KV = (label: string, value: string) => {
    doc.font(B).text(`${label}: `, { continued: true })
    doc.font(B).text(value).moveDown(0.1)
  }

  doc.fontSize(18).font(B).text('MESAFELİ SATIŞ SÖZLEŞMESİ', { align: 'center' })
  doc.moveDown()

  H2('1. TARAFLAR')
  P('İşbu Mesafeli Satış Sözleşmesi (“Sözleşme”), aşağıda bilgileri yer alan taraflar arasında 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri çerçevesinde elektronik ortamda kurulmuştur.')

  H3('A. ALICI (Sözleşmede “ALICI” olarak anılacaktır)')
  KV('Adı Soyadı / Unvanı', d.buyerName)
  KV('Adresi', `${d.city} / ${d.district}`)
  KV('Telefon', d.buyerPhone)
  KV('E-posta / Kullanıcı Adı', d.buyerEmail)

  H3('B. SATICI (Sözleşmede “ŞİRKET” olarak anılacaktır)')
  KV('Unvan', 'Gerekli Kitaplar Yayıncılık Ltd. Şti.')
  KV('Adres', 'Rasimpaşa Mah. Elmalıçeşme Sok. No: 23/8 Kadıköy/İstanbul')
  KV('Telefon', '0 (541) 788 94 98')
  KV('KEP', 'gereklikitaplar@hs01.kep.tr')
  KV('E-posta', 'info@boook.love')

  P('ALICI, işbu Sözleşme’yi elektronik ortamda onayladığında, abonelik bedelini ve varsa ilgili vergileri, seçtiği ödeme planına uygun şekilde ödemeyi peşinen kabul ve taahhüt eder.')

  H2('2. TANIMLAR')
  P('BAKAN: Ticaret Bakanı’nı,')
  P('BAKANLIK: Ticaret Bakanlığı’nı,')
  P('KANUN: 6502 sayılı Tüketicinin Korunması Hakkında Kanun’u,')
  P('YÖNETMELİK: Mesafeli Sözleşmeler Yönetmeliği’ni (RG:27.11.2014/29188),')
  P('HİZMET: SATICI tarafından sunulan, elektronik ortamda çevrimiçi kitap kulübü üyelik/abonelik hizmetini,')
  P('SATICI: Ticari veya mesleki faaliyetleri kapsamında tüketiciye dijital hizmet sunan gerçek veya tüzel kişiyi,')
  P('ALICI: Bu hizmeti ticari veya mesleki olmayan amaçlarla edinen, kullanan veya yararlanan gerçek ya da tüzel kişiyi,')
  P('SİTE: SATICI’ya ait internet sitesini,')
  P('SİPARİŞ VEREN: Hizmeti SATICI’ya ait internet sitesi üzerinden talep eden gerçek veya tüzel kişiyi,')
  P('SÖZLEŞME: İşbu Mesafeli Satış Sözleşmesi’ni ifade eder.')

  H2('3. KONU')
  P('İşbu Sözleşme, ALICI’nın SATICI’ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği Kitap Kulübü Aboneliği dijital hizmetinin sunulması ve buna ilişkin hak ve yükümlülüklerin belirlenmesi amacıyla düzenlenmiştir.')
  P('Listelenen ve ilan edilen abonelik bedelleri güncel fiyatları ifade eder; SATICI tarafından güncellenene kadar geçerlidir. Süreli kampanyalarda belirtilen özel fiyatlar sadece kampanya süresi boyunca geçerlidir.')

  H2('4. HİZMETİN TEMEL ÖZELLİKLERİ VE ÜCRET')
  KV('Hizmet Açıklaması', 'Kitap Kulübü Aboneliği (çevrimiçi erişim, dijital içerikler ve etkinliklere katılım)')
  KV('Ödeme Şekli ve Planı', 'Kredi/banka kartı ile aylık tekrarlayan abonelik ödemesi')
  KV('Toplam Bedel', `${d.priceTRY} TL (KDV dâhil, aylık abonelik bedeli)`)
  KV('Fatura Teslimi', 'E-Arşiv fatura, ALICI’nın e-posta adresine gönderilecektir.')
  KV('Abonelik Başlangıç Tarihi', tarih)
  KV('Hizmetin Sunumu', 'Dijital ortamda, ALICI’nın SİTE üzerinden oluşturduğu hesabına erişim sağlanması suretiyle')

  H2('5. GENEL HÜKÜMLER')
  P('ALICI, Sözleşme konusu hizmetin temel nitelikleri, abonelik bedeli, ödeme planı ve kullanım şartları hakkında doğru ve eksiksiz olarak bilgilendirildiğini, elektronik ortamda onay verdiğini kabul ve beyan eder.')
  P('SATICI, hizmeti sözleşmede belirtilen şekilde, zamanında ve eksiksiz sunmayı, ilgili mevzuata uygun hareket etmeyi taahhüt eder.')
  P('ALICI, ödeme yükümlülüğünü yerine getirmediği veya banka kayıtlarında iptal/geri ödeme gerçekleştiği takdirde, SATICI’nın hizmeti sunma yükümlülüğünün sona ereceğini kabul eder.')
  P('Mücbir sebepler nedeniyle hizmetin sunulmasının imkânsızlaştığı hallerde, SATICI durumu derhal ALICI’ya bildirir; bu durumda ALICI sözleşmeyi feshedebilir. Fesih halinde ödenmiş bedeller, ilgili mevzuat çerçevesinde iade edilir.')
  P('SATICI, ALICI’ya ait iletişim bilgileri üzerinden bilgilendirme, kampanya ve pazarlama amaçlı iletişim kurabilir; ALICI bu iletişimlere dilediği zaman son verebilir.')
  P('ALICI, SİTE kullanımında mevzuata ve ahlaka aykırı davranmayacağını, kişisel bilgilerin doğruluğunu taahhüt eder.')

  H2('6. CAYMA HAKKI')
  P('Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesi uyarınca, dijital içerik veya çevrimiçi hizmet aboneliklerinde, tüketicinin onayı ile hizmetin ifasına başlanması halinde cayma hakkı kullanılamaz. ALICI, işbu sözleşmeyi onaylayarak bu hususta bilgilendirildiğini kabul eder.')
  P('Cayma hakkının kullanılabilmesi için, 14 gün içinde SATICI’ya e-posta veya yazılı bildirim yapılması gerekmektedir. ALICI, aboneliğini dilediği zaman iptal edebilir; iptal sonrası tekrarlı ödeme yapılmaz ve hizmetin ifası başlamadığından bir sonraki ödeme tahsil edilmez.')

  H2('7. TEMERRÜT HALİ VE HUKUKİ SONUÇLARI')
  P('ALICI’nın ödeme işlemlerini kredi/banka kartı ile yaptığı durumda temerrüde düşmesi halinde, kart sahibi banka ile arasındaki kredi kartı sözleşmesi çerçevesinde faiz ödeyeceğini ve bankaya karşı sorumlu olacağını kabul eder. Bu durumda SATICI, aboneliği durdurma veya feshetme hakkına sahiptir.')

  H2('8. YETKİLİ MAHKEME')
  P('İşbu Sözleşmeden doğan uyuşmazlıklarda, Tüketici Hakem Heyetleri veya Tüketici Mahkemeleri yetkilidir. 01/01/2025 tarihinden itibaren, 2025 yılı için değeri 149.000 TL’nin altında bulunan uyuşmazlıklar hakkında İl veya İlçe Tüketici Hakem Heyetlerine başvuru yapılabilecektir.')

  H2('9. YÜRÜRLÜK')
  P('ALICI, SİTE üzerinden abonelik işlemini onayladığında işbu Sözleşme tüm hükümleriyle yürürlüğe girer.')

  doc.moveDown(0.6)
  KV('SATICI', 'Gerekli Kitaplar Yayıncılık Ltd. Şti.')
  KV('ALICI', d.buyerName)
  KV('TARİH', tarih)
  KV('MERSİS NO', '039409931190001')
}

// Basit HTML escape
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
