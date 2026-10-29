"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hataIsle } from "@/lib/eylem";

function sayi(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function sayiVeyaBos(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return sayi(v);
}

function metin(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function bildir(yol: string, mesaj: string): never {
  const ayrac = yol.includes("?") ? "&" : "?";
  // replace: kaydetme dönüşü geri geçmişine yeni ekran olarak yazılmaz
  redirect(`${yol}${ayrac}kaydedildi=${encodeURIComponent(mesaj)}`, RedirectType.replace);
}

export async function antrenmanKaydet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = metin(formData.get("id"));

  const kayit = {
    tarih: String(formData.get("tarih")),
    baslangic: metin(formData.get("baslangic")),
    sure_dk: sayiVeyaBos(formData.get("sure_dk")),
    yas_grubu: metin(formData.get("yas_grubu")),
    yer: metin(formData.get("yer")),
    tur: String(formData.get("tur") ?? "saha"),
    baslik: String(formData.get("baslik") ?? "").trim(),
    icerik: metin(formData.get("icerik")),
    hedef: metin(formData.get("hedef")),
  };

  if (!kayit.baslik) throw new Error("Başlık zorunludur.");

  if (id) {
    const { error } = await supabase
      .from("spor_antrenmanlar")
      .update({ ...kayit, updated_at: new Date().toISOString() })
      .eq("id", id);
    hataIsle(error, `/antrenor/antrenmanlar/${id}`);
    revalidatePath(`/antrenor/antrenmanlar/${id}`);
    bildir(`/antrenor/antrenmanlar/${id}`, "Antrenman güncellendi");
  }

  const { data, error } = await supabase
    .from("spor_antrenmanlar")
    .insert({ ...kayit, ekleyen_id: user?.id ?? null })
    .select("id")
    .single();
  hataIsle(error, "/antrenor/antrenmanlar");
  if (!data) throw new Error("Antrenman kaydedilemedi.");

  revalidatePath("/antrenor/antrenmanlar");
  revalidatePath("/panel/antrenman");
  bildir(`/antrenor/antrenmanlar/${data.id}`, "Antrenman eklendi — şimdi yoklama alabilirsiniz");
}

export async function yoklamaKaydet(formData: FormData) {
  const supabase = await createClient();
  const antrenmanId = String(formData.get("antrenman_id"));

  const satirlar: Record<string, unknown>[] = [];
  const silinecek: string[] = [];

  for (const anahtar of formData.keys()) {
    if (!anahtar.startsWith("durum_")) continue;
    const sporcuId = anahtar.slice("durum_".length);
    const durum = String(formData.get(anahtar) ?? "");
    if (!durum || durum === "kayitsiz") {
      silinecek.push(sporcuId);
      continue;
    }
    satirlar.push({ antrenman_id: antrenmanId, sporcu_id: sporcuId, durum });
  }

  if (satirlar.length) {
    const { error } = await supabase
      .from("spor_yoklama")
      .upsert(satirlar, { onConflict: "antrenman_id,sporcu_id" });
    hataIsle(error, `/antrenor/antrenmanlar/${antrenmanId}`);
  }
  if (silinecek.length) {
    const { error } = await supabase
      .from("spor_yoklama")
      .delete()
      .eq("antrenman_id", antrenmanId)
      .in("sporcu_id", silinecek);
    hataIsle(error, `/antrenor/antrenmanlar/${antrenmanId}`);
  }

  revalidatePath(`/antrenor/antrenmanlar/${antrenmanId}`);
  revalidatePath("/panel/antrenman");
  bildir(`/antrenor/antrenmanlar/${antrenmanId}`, `${satirlar.length} sporcu için yoklama alındı`);
}

export async function notKaydet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sporcuId = String(formData.get("sporcu_id"));

  const { error } = await supabase.from("spor_sporcu_notlari").insert({
    sporcu_id: sporcuId,
    icerik: String(formData.get("icerik") ?? "").trim(),
    gorunurluk: String(formData.get("gorunurluk") ?? "veli"),
    tarih: metin(formData.get("tarih")) ?? new Date().toISOString().slice(0, 10),
    yazan_id: user?.id ?? null,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/antrenor/sporcular/${sporcuId}`);
  revalidatePath(`/panel/sporcu/${sporcuId}`);
  bildir(`/antrenor/sporcular/${sporcuId}`, "Not eklendi");
}

export async function degerlendirmeKaydet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sporcuId = String(formData.get("sporcu_id"));
  const ham = String(formData.get("donem"));
  const donem = ham.length === 7 ? `${ham}-01` : ham;

  const { error } = await supabase.from("spor_degerlendirmeler").upsert(
    {
      sporcu_id: sporcuId,
      donem,
      teknik: sayiVeyaBos(formData.get("teknik")),
      fizik: sayiVeyaBos(formData.get("fizik")),
      taktik: sayiVeyaBos(formData.get("taktik")),
      disiplin: sayiVeyaBos(formData.get("disiplin")),
      takim_oyunu: sayiVeyaBos(formData.get("takim_oyunu")),
      yorum: metin(formData.get("yorum")),
      yazan_id: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sporcu_id,donem" },
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/antrenor/sporcular/${sporcuId}`);
  revalidatePath(`/panel/sporcu/${sporcuId}`);
  bildir(`/antrenor/sporcular/${sporcuId}`, "Değerlendirme kaydedildi");
}

export async function olcumKaydet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sporcuId = String(formData.get("sporcu_id"));

  const { error } = await supabase.from("spor_olcumler").upsert(
    {
      sporcu_id: sporcuId,
      tarih: String(formData.get("tarih")),
      boy_cm: sayiVeyaBos(formData.get("boy_cm")),
      kilo_kg: sayiVeyaBos(formData.get("kilo_kg")),
      sprint_20m: sayiVeyaBos(formData.get("sprint_20m")),
      dikey_sicrama_cm: sayiVeyaBos(formData.get("dikey_sicrama_cm")),
      dayaniklilik_dk: sayiVeyaBos(formData.get("dayaniklilik_dk")),
      notlar: metin(formData.get("notlar")),
      yazan_id: user?.id ?? null,
    },
    { onConflict: "sporcu_id,tarih" },
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/antrenor/sporcular/${sporcuId}`);
  revalidatePath(`/panel/sporcu/${sporcuId}`);
  bildir(`/antrenor/sporcular/${sporcuId}`, "Ölçüm kaydedildi");
}

export async function duyuruKaydet(formData: FormData) {
  const supabase = await createClient();
  const hedefRol = String(formData.get("hedef_rol") ?? "herkes");
  const { error } = await supabase.from("spor_duyurular").insert({
    baslik: String(formData.get("baslik") ?? "").trim(),
    icerik: String(formData.get("icerik") ?? "").trim(),
    hedef_rol: ["herkes", "veli", "sporcu", "personel"].includes(hedefRol) ? hedefRol : "herkes",
    hedef_yas_grubu: metin(formData.get("hedef_yas_grubu")),
    onemli: formData.get("onemli") === "on",
    bitis_tarihi: metin(formData.get("bitis_tarihi")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/antrenor/duyurular");
  revalidatePath("/panel");
  bildir("/antrenor/duyurular", "Duyuru yayınlandı");
}

export async function duyuruSil(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("spor_duyurular").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/antrenor/duyurular");
  revalidatePath("/panel");
  bildir("/antrenor/duyurular", "Duyuru kaldırıldı");
}
