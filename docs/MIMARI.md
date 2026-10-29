# Mimari

## Kiracılık: kulüp başına ayrı kurulum

```
                 GitHub: tek depo (bu depo)
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  Vercel projesi     Vercel projesi     Vercel projesi
  NEXT_PUBLIC_KULUP  NEXT_PUBLIC_KULUP  NEXT_PUBLIC_KULUP
  = denizlispor      = kulup-b          = kulup-c
        │                  │                  │
        ▼                  ▼                  ▼
  Supabase A         Supabase B         Supabase C
  (AB / İrlanda)     (kulübün bölgesi)  ...
```

- **Neden ayrı veritabanı?** Çocuk verisi. Tek veritabanında `kulup_id` + RLS ile de ayrılabilirdi,
  ama bir politika hatası tüm kulüplerin verisini açar. Ayrı proje: hata yarıçapı tek kulüp;
  her kulüp KVKK'da kendi veri sorumlusu; ayrılan kulübe yedeği teslim edilir.
- **Bedeli:** şema değişikliği her kurulumda ayrı uygulanır (göç dosyaları `supabase/migrations`).
  Kulüp sayısı ~10'u geçince tek veritabanında çok kiracılı yapıya geçiş yeniden değerlendirilir.
- **Bölge kuralı:** Vercel bölgesi kulübün Supabase bölgesiyle aynı seçilir (İrlanda → `dub1`,
  Frankfurt → `fra1`); aksi halde her sunucu render'ı bir kıta yolculuğu ekler.

## Beyaz etiket akışı

```
src/kulup/kulupler/<kod>.json ──► src/kulup/index.ts
        ad, arma, renkler,            │  KULUP (seçili kulüp)
        supabase.proje                │  markaPaleti(ana, koyu) → 50…900
                                      │  notrPalet(koyu)        → 50…900
                                      ▼
                app/layout.tsx  <style>:root{--marka-500:0 166 80; ...}</style>
                                      │
                tailwind.config.ts    yesil-500 = rgb(var(--marka-500) / <alpha>)
                                      ▼
                         tüm ekranlar kulübün renginde
```

- Sınıf adları (`yesil-*`, `siyah`, `neutral-*`) geçmişten kaldı; değerleri tamamen değişkendir.
- `anametin`: ana renk zemininde okunan yazı rengi (kurulum sihirbazı WCAG kontrastıyla seçer).
- Manifest (`app/manifest.ts`), sayfa başlıkları, açılış ekranı, karne ve kart aynı yapılandırmayı okur.

## Güvenlik katmanları

| Katman | Ne yapar |
|---|---|
| Postgres RLS | Her tabloda; veli yalnızca kendi sporcusunu, sporcu para tablolarını hiç göremez |
| `security definer` fonksiyonlar | Rol kontrolü (`spor_yonetici_mi`, `spor_personel_mi` …), maskeleme (`spor_maskele`) |
| GRANT | Yalnızca `authenticated`; `anon` hiçbir tabloya erişemez |
| Arşiv tetikleyicisi | Güncelleme ve silmenin öncesi `spor_kayit_gecmisi`'ne |
| Uygulama | Sunucu bileşenlerinde rol yönlendirmesi (`lib/yetki.ts`); para ekranları sporcuya kapalı |
| Bağlantı kilidi | `lib/supabase/config.ts`: yapılandırmadaki proje dışındaki adres yok sayılır, yasaklı projeler reddedilir |
| HTTP | `X-Frame-Options: DENY`, HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Dışa aktarım | Yalnızca yönetim; CSV formül enjeksiyonuna karşı hücre temizliği |

## Özellik bayrağı yerine "tablo var mı?"

Yeni bir özellik göç gerektirdiğinde kod önce canlıya çıkabilir. `lib/ozellik.ts › tabloYok()`
PostgREST'in "tablo yok" hatasını tanır; ilgili ekran gizlenir ya da yöneticiye
"veritabanı güncellemesi bekleniyor" der. Böylece her kulüp göçü kendi takviminde uygular.

## Önemli dosyalar

| Dosya | Görev |
|---|---|
| `src/kulup/index.ts` | Kulüp seçimi, palet türetme, kontrast hesabı |
| `src/lib/yetki.ts` | Oturum (`getClaims`, istek başına tek sefer), rol kapıları |
| `src/lib/riza.ts` | KVKK: güncel metin onaylanmadıysa onay ekranına |
| `src/lib/takvim.ts` | RFC 5545 takvim dosyası (satır katlama, kaçış, UTC) |
| `src/lib/csv.ts` | Excel uyumlu CSV (BOM, `;`, formül enjeksiyonu koruması) |
| `src/lib/surumNotlari.ts` | Açılışta role göre gösterilen sürüm notları |
| `supabase/migrations/` | Şema göçleri |

## Bilinen eksikler

- Taban şema (16 tablo, 24 fonksiyon, 51 politika) henüz bu depoda değil; taşıma betiklerinden
  `supabase/migrations/00000000_taban.sql` olarak eklenecek.
- Otomatik test yok; CI tip kontrolü ve her kulüp yapılandırması için derleme yapıyor.
- Ücretsiz Supabase planında otomatik yedek yok; satıştan önce Pro.
