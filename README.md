# Boook.Love (MVP)

Türkçe UI, İngilizce kod. Next.js 14 + Prisma + NextAuth.

## Kurulum
```bash
pnpm i   # veya npm i / yarn
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Admin hesabı: `superadmin@book.love` / `admin123`  
Moderatör: `moderator@book.love` / `moderator123`  
Kullanıcı: `user@book.love` / `user123`

## Özellikler
- Ana sayfa: hero slider, canlı arama & filtre, **sonsuz kaydırma**
- Kulüp detayı: banner, moderatör, **bu ayın seçkisi**, eski seçkiler, **abonelik simülasyonu**
- Profil: bilgileri güncelle, kulüplerim
- Admin: kulüp oluşturma, rol atama, **üyeler listesi**
- Moderator: kulüp ayarları, seçki ve etkinlik yönetimi, **canlı yayın placeholder**
- Chat: abonelere özel, **alıntıla** ve mention yazımı, basit presence ping

> Not: Chat gerçek zamanlı WS yerine basit fetch ile tazeliyor (MVP). Upstash/Socket katmanı eklenebilir.
