/**
 * Excel'in Türkçe ayarlarıyla doğrudan açılan CSV: noktalı virgül ayırıcı + UTF-8 BOM.
 * Formül enjeksiyonuna karşı = + - @ ile başlayan hücreler tek tırnakla etkisizleştirilir.
 */
export type CsvSutun<T> = { baslik: string; deger: (satir: T) => unknown };

function hucre(v: unknown) {
  if (v === null || v === undefined) return "";
  let s = typeof v === "number" ? v.toLocaleString("tr-TR", { useGrouping: false }) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvOlustur<T>(sutunlar: CsvSutun<T>[], satirlar: T[]) {
  const govde = [
    sutunlar.map((s) => hucre(s.baslik)).join(";"),
    ...satirlar.map((r) => sutunlar.map((s) => hucre(s.deger(r))).join(";")),
  ].join("\r\n");
  return "\uFEFF" + govde + "\r\n";
}
