"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KVKK_SURUMU } from "@/lib/kvkk";

/** Gösterilen duyuruları okundu olarak işaretler (tekrar çağrılırsa sessizce geçer). */
export async function duyurulariOkundu(idler: string[]) {
  if (!idler.length) return;
  const supabase = await createClient();
  await supabase
    .from("spor_duyuru_okunma")
    .upsert(idler.slice(0, 50).map((duyuru_id) => ({ duyuru_id })), {
      onConflict: "duyuru_id,kullanici_id",
      ignoreDuplicates: true,
    });
  revalidatePath("/panel");
}

export async function rizaKaydet(formData: FormData) {
  const supabase = await createClient();
  if (formData.get("aydinlatma") !== "on") {
    redirect("/kvkk/onay?hata=Devam etmek için aydınlatma metnini okuduğunuzu onaylayın", RedirectType.replace);
  }
  const { error } = await supabase.from("spor_rizalar").insert({
    metin_surumu: KVKK_SURUMU,
    aydinlatma: true,
    acik_riza: formData.get("acik_riza") === "on",
    iletisim: formData.get("iletisim") === "on",
  });
  if (error) throw new Error(error.message);
  const devam = String(formData.get("devam") ?? "/git");
  redirect(devam.startsWith("/") && !devam.startsWith("//") ? devam : "/git", RedirectType.replace);
}
