export const metadata = { title: 'Gizlilik — bo❤️ok.love' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 prose prose-neutral">
      <h1>Gizlilik Politikası</h1>
      <p>
        Kişisel verilerinizi; üyelik, kulüp aboneliği ve etkinlik yönetimi için gerekli asgari ölçüde işleriz.
        Verileriniz üçüncü taraflara satılmaz. Yasal yükümlülükler ve hizmet sağlayıcılar (barındırma, veritabanı vb.)
        ile sınırlı paylaşım yapılabilir.
      </p>
      <h2>Toplanan Veriler</h2>
      <ul>
        <li>Hesap bilgileri (ad, e-posta)</li>
        <li>Abonelik ve oturum katılım kayıtları</li>
        <li>Çerezler ve kullanım analitiği (iyileştirme amaçlı)</li>
      </ul>
      <h2>Haklarınız</h2>
      <p>Erişim, düzeltme, silme ve itiraz haklarınızı <a href="/contact">İletişim</a> bölümünden kullanabilirsiniz.</p>
    </main>
  );
}
