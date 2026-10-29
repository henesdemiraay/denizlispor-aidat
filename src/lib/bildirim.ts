import type { SupabaseClient } from "@supabase/supabase-js";
import { tabloYok } from "@/lib/ozellik";

export type Bildirim = {
  id: string;
  tur: string;
  baslik: string;
  govde: string | null;
  yol: string | null;
  gorunur_zaman: string;
  okundu: string | null;
};

/** Okunmamış bildirim sayısı; göç yoksa 0. */
export async function okunmamisSayisi(supabase: SupabaseClient) {
  const { count, error } = await supabase
    .from("spor_bildirimler")
    .select("id", { count: "exact", head: true })
    .is("okundu", null);
  if (error) return 0;
  return count ?? 0;
}

/** Kişinin bildirim kutusu (yeniden eskiye); göç yoksa null. */
export async function bildirimleriGetir(supabase: SupabaseClient, limit = 60) {
  const { data, error } = await supabase
    .from("spor_bildirimler")
    .select("id, tur, baslik, govde, yol, gorunur_zaman, okundu")
    .order("gorunur_zaman", { ascending: false })
    .limit(limit);
  if (tabloYok(error)) return null;
  return (data ?? []) as Bildirim[];
}

export const BILDIRIM_TURU: Record<string, { ad: string; acil?: boolean }> = {
  aidat_yaklasiyor: { ad: "Aidat" },
  aidat_bugun: { ad: "Aidat", acil: true },
  aidat_gecikti: { ad: "Aidat", acil: true },
  yoklama_gelmedi: { ad: "Yoklama", acil: true },
  odeme_onaylandi: { ad: "Ödeme" },
  odeme_reddedildi: { ad: "Ödeme", acil: true },
  kayit_onaylandi: { ad: "Kayıt" },
  yeni_odeme: { ad: "Onay bekliyor", acil: true },
  yeni_kayit: { ad: "Onay bekliyor", acil: true },
  deneme_dersi: { ad: "Deneme dersi" },
};
