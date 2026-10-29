import type { SupabaseClient } from "@supabase/supabase-js";
import { tabloYok } from "@/lib/ozellik";
import { bugunkuSezon, sezonBittiMi } from "@/lib/sezon";

/** Mühürleme anında saklanan sezon özeti (veritabanı: spor_sezon_ozeti). Ad soyad tutulmaz. */
export type KadroSatiri = {
  sporcu_id: string;
  yas_grubu: string | null;
  forma_no: number | null;
  mac: number;
  dakika: number;
  gol: number;
  asist: number;
  antrenman_geldi: number;
  antrenman_sayilan: number;
};

export type SezonOzeti = {
  sezon: number;
  ad: string;
  bas: string;
  bit: string;
  mac: number;
  galibiyet: number;
  beraberlik: number;
  maglubiyet: number;
  gol_atilan: number;
  gol_yenilen: number;
  antrenman: number;
  antrenman_dk: number;
  devam_orani: number | null;
  yas_gruplari: string[];
  sporcu: number;
  kadro: KadroSatiri[];
  olusturma: string;
};

export type GecmisKaydi = { islem: "muhurle" | "muhur_ac"; zaman: string; kim: string | null; neden?: string };

export type SezonKaydi = {
  yil: number;
  durum: "acik" | "muhurlu";
  kapanis_notu: string | null;
  ozet: SezonOzeti | Record<string, never>;
  muhurleme_zamani: string | null;
  gecmis: GecmisKaydi[];
};

export type Ani = {
  id: string;
  sezon_yil: number;
  baslik: string;
  aciklama: string | null;
  foto_yolu: string | null;
  tarih: string | null;
  yas_grubu: string | null;
  created_at: string;
};

export type Yukselen = {
  id: string;
  sporcu_id: string | null;
  ad_soyad: string;
  sezon_yil: number;
  hedef: string;
  mevki: string | null;
  aciklama: string | null;
  foto_yolu: string | null;
};

export const ARSIV_KOVASI = "spor-arsiv";

export type SezonDurumu = "suruyor" | "kapanis_bekliyor" | "muhurlu";

export function sezonDurumu(yil: number, kayit: Pick<SezonKaydi, "durum"> | undefined): SezonDurumu {
  if (kayit?.durum === "muhurlu") return "muhurlu";
  if (yil >= bugunkuSezon() || !sezonBittiMi(yil)) return "suruyor";
  return "kapanis_bekliyor";
}

export const SEZON_DURUM_ADI: Record<SezonDurumu, string> = {
  suruyor: "SÜRÜYOR",
  kapanis_bekliyor: "KAPANIŞ BEKLİYOR",
  muhurlu: "MÜHÜRLENDİ",
};

export function ozetVarMi(o: SezonKaydi["ozet"] | null | undefined): o is SezonOzeti {
  return !!o && typeof (o as SezonOzeti).sezon === "number";
}

/**
 * Arşiv tablolarını okur. Göç henüz uygulanmadıysa `null` döner ve ekranlar
 * arşiv bölümlerini gizler (bkz. lib/ozellik.ts).
 */
export async function arsivGetir(supabase: SupabaseClient) {
  const [sezon, ani, yukselen] = await Promise.all([
    supabase.from("spor_sezonlar").select("yil, durum, kapanis_notu, ozet, muhurleme_zamani, gecmis"),
    supabase
      .from("spor_sezon_anilari")
      .select("*")
      .order("tarih", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("spor_yukselenler").select("*").order("sezon_yil", { ascending: false }).limit(500),
  ]);
  if (tabloYok(sezon.error)) return null;

  const sezonlar = new Map<number, SezonKaydi>();
  for (const s of (sezon.data ?? []) as SezonKaydi[]) sezonlar.set(s.yil, s);

  return {
    sezonlar,
    anilar: (ani.data ?? []) as Ani[],
    yukselenler: (yukselen.data ?? []) as Yukselen[],
  };
}

/** Arşiv kovasındaki fotoğraflar için bir saatlik imzalı adresler */
export async function arsivFotolari(supabase: SupabaseClient, yollar: (string | null)[]) {
  const temiz = [...new Set(yollar.filter(Boolean) as string[])];
  const adresler = new Map<string, string>();
  if (!temiz.length) return adresler;
  const { data } = await supabase.storage.from(ARSIV_KOVASI).createSignedUrls(temiz, 60 * 60);
  for (const l of data ?? []) if (l.path && l.signedUrl) adresler.set(l.path, l.signedUrl);
  return adresler;
}
