import { redirect, RedirectType } from "next/navigation";

/** Mühürlü sezona yazma denemesi mi? (veritabanındaki spor_muhur_koruma tetikleyicisinin mesajı) */
export function muhurHatasiMi(mesaj: string | null | undefined) {
  return /mühürlendi/i.test(mesaj ?? "");
}

/** Ekranda kırmızı uyarı göstererek aynı ekrana döner (bkz. KayitBildirimi). */
export function uyar(yol: string, mesaj: string): never {
  const ayrac = yol.includes("?") ? "&" : "?";
  redirect(`${yol}${ayrac}uyari=${encodeURIComponent(mesaj)}`, RedirectType.replace);
}

/**
 * Veritabanı hatasını işler. Kullanıcının çözebileceği hatalar (mühürlü sezon)
 * uyarı olarak ekrana döner; diğerleri fırlatılır (genel hata ekranı).
 */
export function hataIsle(error: { message: string } | null, yol: string) {
  if (!error) return;
  if (muhurHatasiMi(error.message)) {
    uyar(yol, `${error.message} Gerekirse yönetim mührü Sezonlar ekranından açabilir.`);
  }
  throw new Error(error.message);
}
