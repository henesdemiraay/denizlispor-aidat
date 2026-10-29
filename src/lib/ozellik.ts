/**
 * Göçü (migration) henüz uygulanmamış bir tabloya erişildiğinde PostgREST
 * "tablo yok" der. Bu durumda özellik kapalı sayılır ve ekran sessizce gizlenir:
 * kod canlıya veritabanından önce çıkabilir, hiçbir ekran bozulmaz.
 */
export function tabloYok(hata: { code?: string; message?: string } | null | undefined) {
  if (!hata) return false;
  return (
    hata.code === "42P01" ||
    hata.code === "PGRST205" ||
    /does not exist|could not find the table/i.test(hata.message ?? "")
  );
}
