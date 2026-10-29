"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uyar } from "@/lib/eylem";
import { ARSIV_KOVASI } from "@/lib/arsiv";

function metin(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function yilAl(formData: FormData) {
  const yil = Number(formData.get("yil") ?? formData.get("sezon_yil"));
  if (!Number.isInteger(yil) || yil < 1950 || yil > 2100) throw new Error("Geçersiz sezon.");
  return yil;
}

function bildir(yol: string, mesaj: string): never {
  redirect(`${yol}?kaydedildi=${encodeURIComponent(mesaj)}`, RedirectType.replace);
}

function tazele(yil: number) {
  revalidatePath("/yonetim/sezonlar");
  revalidatePath(`/yonetim/sezonlar/${yil}`);
  revalidatePath("/panel/arsiv");
}

/** Veritabanı fonksiyonlarının mesajları kullanıcıya yöneliktir: uyarı olarak gösterilir. */
function rpcHatasi(error: { message: string } | null, yol: string) {
  if (error) uyar(yol, error.message);
}

export async function sezonMuhurle(formData: FormData) {
  const yil = yilAl(formData);
  const yol = `/yonetim/sezonlar/${yil}`;
  if (formData.get("onay") !== "on") uyar(yol, "Mühürlemeden önce kayıtların tamam olduğunu onaylayın.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("spor_sezon_muhurle", {
    p_yil: yil,
    p_not: metin(formData.get("kapanis_notu")),
  });
  rpcHatasi(error, yol);
  tazele(yil);
  bildir(yol, "Sezon mühürlendi ve arşive işlendi");
}

export async function sezonMuhurAc(formData: FormData) {
  const yil = yilAl(formData);
  const yol = `/yonetim/sezonlar/${yil}`;
  const supabase = await createClient();
  const { error } = await supabase.rpc("spor_sezon_muhur_ac", {
    p_yil: yil,
    p_neden: String(formData.get("neden") ?? ""),
  });
  rpcHatasi(error, yol);
  tazele(yil);
  bildir(yol, "Mühür açıldı — düzeltmeden sonra yeniden mühürleyin");
}

export async function sezonNotKaydet(formData: FormData) {
  const yil = yilAl(formData);
  const yol = `/yonetim/sezonlar/${yil}`;
  const supabase = await createClient();
  const { error } = await supabase.rpc("spor_sezon_not_kaydet", {
    p_yil: yil,
    p_not: metin(formData.get("kapanis_notu")),
  });
  rpcHatasi(error, yol);
  tazele(yil);
  bildir(yol, "Kapanış notu kaydedildi");
}

export async function yukselenKaydet(formData: FormData) {
  const yil = yilAl(formData);
  const yol = `/yonetim/sezonlar/${yil}`;
  const supabase = await createClient();

  const sporcuId = metin(formData.get("sporcu_id"));
  let adSoyad = metin(formData.get("ad_soyad"));
  if (!adSoyad && sporcuId) {
    const { data } = await supabase.from("spor_sporcular").select("ad, soyad").eq("id", sporcuId).single();
    if (data) adSoyad = `${data.ad} ${data.soyad}`.trim();
  }
  const hedef = metin(formData.get("hedef"));
  if (!adSoyad || !hedef) uyar(yol, "Ad soyad (ya da sporcu) ve yükseldiği takım zorunludur.");

  const { error } = await supabase.from("spor_yukselenler").insert({
    sporcu_id: sporcuId,
    ad_soyad: adSoyad,
    sezon_yil: yil,
    hedef,
    mevki: metin(formData.get("mevki")),
    aciklama: metin(formData.get("aciklama")),
  });
  if (error) uyar(yol, `Kaydedilemedi: ${error.message}`);
  tazele(yil);
  bildir(yol, `${adSoyad} yükselenler rafına eklendi`);
}

export async function yukselenSil(formData: FormData) {
  const yil = yilAl(formData);
  const yol = `/yonetim/sezonlar/${yil}`;
  const supabase = await createClient();
  const { error } = await supabase.from("spor_yukselenler").delete().eq("id", String(formData.get("id")));
  if (error) uyar(yol, `Silinemedi: ${error.message}`);
  tazele(yil);
  bildir(yol, "Kayıt kaldırıldı");
}

export async function aniSil(formData: FormData) {
  const yil = yilAl(formData);
  const yol = `/yonetim/sezonlar/${yil}`;
  const supabase = await createClient();
  const { error } = await supabase.from("spor_sezon_anilari").delete().eq("id", String(formData.get("id")));
  if (error) uyar(yol, `Silinemedi: ${error.message}`);
  const foto = metin(formData.get("foto_yolu"));
  if (foto) await supabase.storage.from(ARSIV_KOVASI).remove([foto]);
  tazele(yil);
  bildir(yol, "Anı kaldırıldı");
}
