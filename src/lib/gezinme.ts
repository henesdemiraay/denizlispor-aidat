/**
 * Uygulama içi gezinme yığını — telefon uygulaması gibi geri davranışı için.
 *
 * Tarayıcı geçmişi her ekranı biriktirir; uygulamada ise:
 *  - alt menü sekmeleri arası geçiş geçmişe yazılmaz (yer değiştirir),
 *  - "‹" geri düğmesi her zaman bir üst ekrana gider,
 *  - kaydetme sonrası dönüşler yeni kayıt açmaz.
 *
 * Yığın sessionStorage'da tutulur ve tarayıcı geçmişiyle aynı hizada izlenir
 * (components/GezinmeIzi.tsx). Yer değiştiren geçişler (replace) önceden
 * işaretlenir; işaretsiz her geçiş yeni ekran (push) sayılır.
 */

const YIGIN = "gezinme:yigin";
const YER = "gezinme:yer";

function oku(anahtar: string) {
  try {
    return window.sessionStorage.getItem(anahtar);
  } catch {
    return null;
  }
}

function yaz(anahtar: string, deger: string | null) {
  try {
    if (deger === null) window.sessionStorage.removeItem(anahtar);
    else window.sessionStorage.setItem(anahtar, deger);
  } catch {
    /* gizli sekme: yığın tutulamaz, düğmeler yine çalışır */
  }
}

export function yiginOku(): string[] {
  try {
    return JSON.parse(oku(YIGIN) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function yiginYaz(yigin: string[]) {
  yaz(YIGIN, JSON.stringify(yigin.slice(-50)));
}

/** Bir sonraki geçiş mevcut kaydın yerine geçecek (replace). */
export function yerDegistirIsaretle() {
  yaz(YER, "1");
}

/** İşaret varsa okur ve siler. */
export function yerDegistirAl() {
  const v = oku(YER) === "1";
  yaz(YER, null);
  return v;
}

/** Bir önceki ekranın yolu (sorgu dizesi olmadan) */
export function oncekiYol() {
  const y = yiginOku();
  return y.length > 1 ? y[y.length - 2] : null;
}

type Yonlendirici = { back: () => void; replace: (yol: string) => void };

/** Mevcut kaydın yerine git (geçmişe yeni kayıt eklemeden). */
export function yerineGit(router: Yonlendirici, yol: string) {
  yerDegistirIsaretle();
  router.replace(yol);
}

/**
 * Bir üst ekrana dön. Üst ekran geçmişte hemen öncedeyse gerçek "geri" yapılır
 * (cihazın geri tuşuyla aynı yol); değilse üst ekran mevcut kaydın yerine açılır.
 */
export function ustEkranaDon(router: Yonlendirici, hedef: string) {
  const hedefYol = hedef.split("?")[0];
  if (oncekiYol() === hedefYol) router.back();
  else yerineGit(router, hedef);
}
