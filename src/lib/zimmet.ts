export type Zimmet = {
  id: string;
  sporcu_id: string;
  esya: string;
  beden: string | null;
  adet: number;
  verilis: string;
  iade_beklenen: string | null;
  iade_edildi: string | null;
  notlar: string | null;
};

export type ZimmetDurumu = "iade" | "gecikti" | "yaklasiyor" | "sende";

/** Eşyanın bugüne göre durumu. Tarihler "YYYY-MM-DD". "yaklasiyor": iadeye 7 gün ya da daha az. */
export function zimmetDurumu(z: Pick<Zimmet, "iade_beklenen" | "iade_edildi">, bugun: string): ZimmetDurumu {
  if (z.iade_edildi) return "iade";
  if (!z.iade_beklenen) return "sende";
  const fark = (Date.parse(z.iade_beklenen) - Date.parse(bugun)) / 86400000;
  if (fark < 0) return "gecikti";
  if (fark <= 7) return "yaklasiyor";
  return "sende";
}

export const ZIMMET_DURUMU: Record<ZimmetDurumu, { ad: string; sinif: string }> = {
  gecikti: { ad: "İadesi gecikti", sinif: "bg-red-100 text-red-800" },
  yaklasiyor: { ad: "İade yaklaşıyor", sinif: "bg-amber-100 text-amber-800" },
  sende: { ad: "Sporcuda", sinif: "bg-neutral-100 text-neutral-700" },
  iade: { ad: "İade alındı", sinif: "bg-emerald-100 text-emerald-800" },
};

/** Gecikenler önce, sonra iade tarihi yakın olan; iade alınanlar en sonda. */
export function zimmetSirala<T extends Pick<Zimmet, "iade_beklenen" | "iade_edildi" | "verilis">>(liste: T[], bugun: string) {
  const sira: Record<ZimmetDurumu, number> = { gecikti: 0, yaklasiyor: 1, sende: 2, iade: 3 };
  return [...liste].sort(
    (a, b) =>
      sira[zimmetDurumu(a, bugun)] - sira[zimmetDurumu(b, bugun)] ||
      (a.iade_beklenen ?? "9999").localeCompare(b.iade_beklenen ?? "9999") ||
      b.verilis.localeCompare(a.verilis),
  );
}

/** Sık verilen eşyalar (form önerileri). */
export const ZIMMET_ONERI = ["Maç forması", "Antrenman forması", "Eşofman takımı", "Şort", "Tozluk", "Yağmurluk", "Çanta", "Top"];
