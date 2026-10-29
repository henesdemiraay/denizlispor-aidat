// Supabase bağlantı bilgileri.
// Publishable (anon) anahtar tarayıcıda görünmek üzere tasarlanmıştır;
// asıl güvenlik veritabanındaki RLS politikalarıyla sağlanır.
//
// 29 Ekim 2026: Denizlispor Altyapı kendi Supabase projesine taşındı (okul veritabanından ayrıldı).
// Adres bilerek koda sabitlendi: Vercel'de eski projeye işaret eden ortam değişkeni kalmışsa
// uygulamanın yanlışlıkla okul veritabanına bağlanmasını önler.
export const SUPABASE_URL = "https://ikglmbnoknxmhxexzboi.supabase.co";

export const SUPABASE_ANON_KEY = "sb_publishable_EAx5TuiZZPcplpBf7AnqTA_Kfb1E_PG";
