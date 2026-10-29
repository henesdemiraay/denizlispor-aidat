import { cache } from "react";
import { redirect } from "next/navigation";
import { oturum } from "@/lib/yetki";
import { tabloYok } from "@/lib/ozellik";
import { KVKK_SURUMU, type RizaKaydi } from "@/lib/kvkk";

/** Kişinin en son rıza kaydı. undefined = özellik kapalı (tablo kurulmamış), null = kayıt yok. */
export const sonRiza = cache(async (): Promise<RizaKaydi | null | undefined> => {
  const { supabase, user } = await oturum();
  const { data, error } = await supabase
    .from("spor_rizalar")
    .select("acik_riza, iletisim, metin_surumu, created_at")
    .eq("kullanici_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (tabloYok(error)) return undefined;
  if (error) return undefined; // erişim hatasında kişiyi kilitlemeyiz
  return ((data ?? [])[0] as RizaKaydi | undefined) ?? null;
});

/** Güncel KVKK metni onaylanmamışsa onay ekranına gönderir. */
export async function rizaGerekli() {
  const r = await sonRiza();
  if (r === undefined) return;
  if (!r || r.metin_surumu !== KVKK_SURUMU) redirect("/kvkk/onay");
}
