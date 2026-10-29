import type { SupabaseClient } from "@supabase/supabase-js";
import type { CsvSutun } from "@/lib/csv";

type Satir = Record<string, unknown> & { spor_sporcular?: { ad: string; soyad: string } | null };

const sporcuAdi = (r: Satir) => (r.spor_sporcular ? `${r.spor_sporcular.ad} ${r.spor_sporcular.soyad}` : "");

export type DisaAktarim = {
  ad: string;
  aciklama: string;
  kisisel: boolean;
  getir: (s: SupabaseClient) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
  sutunlar: CsvSutun<Satir>[];
};

/** Yönetimin dışa aktarabildiği tablolar. Erişim yine RLS'ye tabidir. */
export const DISA_AKTARIMLAR: Record<string, DisaAktarim> = {
  sporcular: {
    ad: "Sporcu listesi",
    aciklama: "Kimlik, yaş grubu, durum, aylık aidat ve veli iletişim bilgileri",
    kisisel: true,
    getir: (s) => s.from("spor_sporcular").select("*").order("soyad"),
    sutunlar: [
      { baslik: "Ad", deger: (r) => r.ad },
      { baslik: "Soyad", deger: (r) => r.soyad },
      { baslik: "Doğum tarihi", deger: (r) => r.dogum_tarihi },
      { baslik: "Yaş grubu", deger: (r) => r.yas_grubu },
      { baslik: "Mevki", deger: (r) => r.mevki },
      { baslik: "Forma no", deger: (r) => r.forma_no },
      { baslik: "Durum", deger: (r) => r.durum },
      { baslik: "Kayıt tarihi", deger: (r) => r.kayit_tarihi },
      { baslik: "Aylık aidat", deger: (r) => Number(r.aylik_aidat ?? 0) },
      { baslik: "Veli", deger: (r) => r.veli_ad_soyad },
      { baslik: "Veli telefon", deger: (r) => r.veli_telefon },
      { baslik: "Veli e-posta", deger: (r) => r.veli_eposta },
    ],
  },
  aidatlar: {
    ad: "Aidat dönemleri",
    aciklama: "Dönem, sporcu, tutar, son ödeme tarihi ve durum",
    kisisel: false,
    getir: (s) => s.from("spor_aidatlar").select("*, spor_sporcular(ad, soyad)").order("donem", { ascending: false }),
    sutunlar: [
      { baslik: "Dönem", deger: (r) => String(r.donem ?? "").slice(0, 7) },
      { baslik: "Sporcu", deger: sporcuAdi },
      { baslik: "Tutar", deger: (r) => Number(r.tutar ?? 0) },
      { baslik: "Son ödeme", deger: (r) => r.son_odeme_tarihi },
      { baslik: "Durum", deger: (r) => r.durum },
      { baslik: "Açıklama", deger: (r) => r.aciklama },
    ],
  },
  odemeler: {
    ad: "Ödemeler",
    aciklama: "Tarih, sporcu, tutar, yöntem ve onay durumu",
    kisisel: false,
    getir: (s) => s.from("spor_odemeler").select("*, spor_sporcular(ad, soyad)").order("odeme_tarihi", { ascending: false }),
    sutunlar: [
      { baslik: "Tarih", deger: (r) => r.odeme_tarihi },
      { baslik: "Sporcu", deger: sporcuAdi },
      { baslik: "Tutar", deger: (r) => Number(r.tutar ?? 0) },
      { baslik: "Yöntem", deger: (r) => r.yontem },
      { baslik: "Durum", deger: (r) => r.durum },
      { baslik: "Açıklama", deger: (r) => r.aciklama },
    ],
  },
  kasa: {
    ad: "Kasa hareketleri",
    aciklama: "Kulübe aktarım, gider ve ek gelir kayıtları",
    kisisel: false,
    getir: (s) => s.from("spor_kasa_hareketleri").select("tarih, tur, tutar, kategori, aciklama").order("tarih", { ascending: false }),
    sutunlar: [
      { baslik: "Tarih", deger: (r) => r.tarih },
      { baslik: "Tür", deger: (r) => r.tur },
      { baslik: "Tutar", deger: (r) => Number(r.tutar ?? 0) },
      { baslik: "Kategori", deger: (r) => r.kategori },
      { baslik: "Açıklama", deger: (r) => r.aciklama },
    ],
  },
  yoklama: {
    ad: "Yoklama",
    aciklama: "Antrenman tarihi, sporcu ve katılım durumu",
    kisisel: false,
    getir: (s) =>
      s.from("spor_yoklama").select("durum, spor_sporcular(ad, soyad), spor_antrenmanlar(tarih, baslik, yas_grubu)"),
    sutunlar: [
      { baslik: "Tarih", deger: (r) => (r.spor_antrenmanlar as { tarih?: string } | null)?.tarih },
      { baslik: "Antrenman", deger: (r) => (r.spor_antrenmanlar as { baslik?: string } | null)?.baslik },
      { baslik: "Yaş grubu", deger: (r) => (r.spor_antrenmanlar as { yas_grubu?: string } | null)?.yas_grubu },
      { baslik: "Sporcu", deger: sporcuAdi },
      { baslik: "Durum", deger: (r) => r.durum },
    ],
  },
};
