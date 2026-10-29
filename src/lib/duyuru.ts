import type { SupabaseClient } from "@supabase/supabase-js";
import { tabloYok } from "@/lib/ozellik";
import { personelMi } from "@/lib/roller";

export type Duyuru = {
  id: string;
  baslik: string;
  icerik: string;
  hedef_rol: "herkes" | "veli" | "sporcu" | "personel";
  hedef_yas_grubu: string | null;
  onemli: boolean;
  bitis_tarihi: string | null;
  yazan_id: string | null;
  created_at: string;
};

export const HEDEF_ROL_ADI: Record<Duyuru["hedef_rol"], string> = {
  herkes: "Herkes",
  veli: "Veliler",
  sporcu: "Sporcular",
  personel: "Yalnız kulüp ekibi",
};

/** null = özellik kapalı (tablo henüz kurulmamış) */
export async function duyurulariGetir(
  supabase: SupabaseClient,
  secenek: { rol: string; kullaniciId: string; yasGruplari?: (string | null)[]; hepsi?: boolean; limit?: number },
): Promise<{ duyurular: Duyuru[]; okunan: Set<string> } | null> {
  const bugun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  let sorgu = supabase
    .from("spor_duyurular")
    .select("*")
    .order("onemli", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(secenek.limit ?? 30);
  if (!secenek.hepsi) sorgu = sorgu.or(`bitis_tarihi.is.null,bitis_tarihi.gte.${bugun}`);

  const { data, error } = await sorgu;
  if (tabloYok(error)) return null;
  if (error) return { duyurular: [], okunan: new Set() };

  const gruplar = new Set((secenek.yasGruplari ?? []).filter(Boolean));
  const personel = personelMi(secenek.rol);
  const duyurular = ((data ?? []) as Duyuru[]).filter((d) => {
    if (secenek.hepsi || personel) return true;
    const rolUygun = d.hedef_rol === "herkes" || d.hedef_rol === secenek.rol;
    const grupUygun = !d.hedef_yas_grubu || gruplar.size === 0 || gruplar.has(d.hedef_yas_grubu);
    return rolUygun && grupUygun;
  });

  const okunan = new Set<string>();
  if (duyurular.length) {
    const { data: ok } = await supabase
      .from("spor_duyuru_okunma")
      .select("duyuru_id")
      .eq("kullanici_id", secenek.kullaniciId)
      .in("duyuru_id", duyurular.map((d) => d.id));
    for (const o of ok ?? []) okunan.add(o.duyuru_id as string);
  }
  return { duyurular, okunan };
}
