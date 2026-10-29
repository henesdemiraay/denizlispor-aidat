/**
 * Kısmi ödeme: bir aidatın onaylı ödemelerle kapanan kısmı ve kalanı.
 * Veritabanı da aynı kuralı uygular (spor_odeme_sonrasi): onaylı toplam ≥ tutar → "odendi".
 */
export type AidatOzet = { id: string; tutar: number | string; durum: string };
export type OdemeOzet = { aidat_id: string | null; tutar: number | string; durum: string };

export function odenenler(odemeler: OdemeOzet[]) {
  const m = new Map<string, number>();
  for (const o of odemeler) {
    if (o.durum !== "onaylandi" || !o.aidat_id) continue;
    m.set(o.aidat_id, (m.get(o.aidat_id) ?? 0) + Number(o.tutar));
  }
  return m;
}

/** Ödenmesi gereken kalan; ödenmiş ya da muafsa 0. */
export function kalanTutar(a: AidatOzet, odenen: Map<string, number>) {
  if (a.durum !== "bekliyor") return 0;
  return Math.max(0, Number(a.tutar) - (odenen.get(a.id) ?? 0));
}

/** Kısmen ödenmiş mi? (bir kısmı onaylandı, kalan var) */
export function kismiMi(a: AidatOzet, odenen: Map<string, number>) {
  const o = odenen.get(a.id) ?? 0;
  return a.durum === "bekliyor" && o > 0 && o < Number(a.tutar);
}
