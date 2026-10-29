// Supabase bağlantı bilgileri — kulüp yapılandırmasından (src/kulup) okunur.
//
// Publishable (anon) anahtar tarayıcıda görünmek üzere tasarlanmıştır;
// asıl güvenlik veritabanındaki RLS politikalarıyla sağlanır.
//
// Güvenlik kilidi: kulübün veritabanı proje kodu yapılandırmada sabittir.
// Ortam değişkeni (NEXT_PUBLIC_SUPABASE_URL) başka bir projeye işaret ediyorsa YOK SAYILIR.
// Böylece Vercel'de eski projeden kalmış bir değişken uygulamayı yanlış veritabanına
// (ör. başka bir kurumun verisine) bağlayamaz.
import { KULUP } from "@/kulup";

/** Hiçbir kulüp kurulumunun bağlanmaması gereken projeler. */
const YASAK_PROJELER = ["uoesccavfuthvwuchelj"];

function projeKodu(url: string | undefined) {
  return url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1]?.toLowerCase() ?? null;
}

const beklenen = KULUP.supabase.proje.toLowerCase();
if (YASAK_PROJELER.includes(beklenen)) {
  throw new Error("Kulüp yapılandırması yasaklı bir veritabanına işaret ediyor.");
}

const ortamUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ortamUyumlu = projeKodu(ortamUrl) === beklenen;

if (ortamUrl && !ortamUyumlu && typeof window === "undefined") {
  console.warn(
    `[kulup] NEXT_PUBLIC_SUPABASE_URL kulübün projesiyle (${beklenen}) uyuşmuyor; yok sayıldı.`,
  );
}

export const SUPABASE_URL = `https://${beklenen}.supabase.co`;

export const SUPABASE_ANON_KEY =
  (ortamUyumlu ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) ||
  KULUP.supabase.yayinAnahtari;
