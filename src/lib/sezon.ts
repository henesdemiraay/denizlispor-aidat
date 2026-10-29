/** Sezon Eylül'de başlar: 2025–26 sezonu = 1 Eylül 2025 – 31 Ağustos 2026. */
export function sezonYili(tarih: string) {
  const d = new Date(tarih.slice(0, 10) + "T00:00:00");
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}

export function sezonAraligi(yil: number) {
  return { bas: `${yil}-09-01`, bit: `${yil + 1}-08-31` };
}

export function sezonAdi(yil: number) {
  return `${yil}–${String(yil + 1).slice(2)}`;
}

export function sezonIcinde(tarih: string | null | undefined, yil: number) {
  if (!tarih) return false;
  const { bas, bit } = sezonAraligi(yil);
  const t = tarih.slice(0, 10);
  return t >= bas && t <= bit;
}

export function bugunkuSezon() {
  return sezonYili(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date()));
}
