/**
 * Sporcu listesini Excel'den / CSV'den içe aktarma.
 * Girdi: Excel'den kopyalanan hücreler (sekme ayrımlı) ya da CSV (";" veya "," ayrımlı).
 * İlk satır başlıktır; başlıklar esnek eşleşir ("Adı", "İsim", "Doğum Tarihi", "Veli Tel"…).
 */

export type AlanAdi =
  | "ad" | "soyad" | "ad_soyad" | "dogum_tarihi" | "yas_grubu" | "mevki" | "forma_no" | "okul"
  | "veli_ad_soyad" | "veli_telefon" | "veli_eposta" | "aylik_aidat" | "notlar";

export const ALAN_ADI: Record<AlanAdi, string> = {
  ad: "Ad",
  soyad: "Soyad",
  ad_soyad: "Ad soyad",
  dogum_tarihi: "Doğum tarihi",
  yas_grubu: "Yaş grubu",
  mevki: "Mevki",
  forma_no: "Forma no",
  okul: "Okul",
  veli_ad_soyad: "Veli ad soyad",
  veli_telefon: "Veli telefonu",
  veli_eposta: "Veli e-postası",
  aylik_aidat: "Aylık aidat",
  notlar: "Not",
};

/** Başlığı sadeleştirir: küçük harf, Türkçe harfler Latin karşılığına, boşluk/noktalama yok. */
export function sade(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]/g, "");
}

// Sıra önemli: daha özel eşleşmeler önce (veli adı, "ad"dan önce gelmeli).
const ESLESME: [AlanAdi, RegExp][] = [
  ["veli_eposta", /^(veli)?(eposta|email|mail)/],
  ["veli_telefon", /^(veli)?(tel|telefon|gsm|cep)/],
  ["veli_ad_soyad", /^veli(adi?soyadi?|adi?|isim|adsoyad)?$/],
  ["ad_soyad", /^(sporcu)?(adsoyad|adisoyadi|isimsoyisim|adsoyadi)$/],
  ["soyad", /^(sporcu)?soy(ad|adi|isim)$/],
  ["ad", /^(sporcu)?(ad|adi|isim|isim)$/],
  ["dogum_tarihi", /^(dogum|dogumtarihi|dtarihi|dt)$/],
  ["yas_grubu", /^(yasgrubu|grup|takim|kategori|yas)$/],
  ["mevki", /^(mevki|pozisyon|mevkii)$/],
  ["forma_no", /^(forma|formano|formanumarasi|numara|no)$/],
  ["okul", /^okul/],
  ["aylik_aidat", /^(aylikaidat|aidat|ucret|aylikucret)/],
  ["notlar", /^(not|notlar|aciklama)$/],
];

export function basligiEsle(baslik: string): AlanAdi | null {
  const b = sade(baslik);
  if (!b) return null;
  for (const [alan, re] of ESLESME) if (re.test(b)) return alan;
  return null;
}

/** Tırnaklı hücreleri destekleyen ayrıştırıcı. Ayırıcı otomatik: sekme > ";" > ",". */
export function tabloAyristir(metin: string): string[][] {
  const temiz = metin.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trimEnd();
  if (!temiz) return [];
  const ilk = temiz.split("\n", 1)[0];
  const ayirici = ilk.includes("\t") ? "\t" : (ilk.match(/;/g)?.length ?? 0) >= (ilk.match(/,/g)?.length ?? 0) ? ";" : ",";

  const satirlar: string[][] = [];
  let satir: string[] = [];
  let hucre = "";
  let tirnak = false;
  for (let i = 0; i < temiz.length; i++) {
    const c = temiz[i];
    if (tirnak) {
      if (c === '"' && temiz[i + 1] === '"') { hucre += '"'; i++; }
      else if (c === '"') tirnak = false;
      else hucre += c;
    } else if (c === '"' && hucre === "") tirnak = true;
    else if (c === ayirici) { satir.push(hucre); hucre = ""; }
    else if (c === "\n") { satir.push(hucre); satirlar.push(satir); satir = []; hucre = ""; }
    else hucre += c;
  }
  satir.push(hucre);
  satirlar.push(satir);
  return satirlar.filter((r) => r.some((h) => h.trim() !== ""));
}

/** "05.03.2014", "5/3/2014", "2014-03-05" → "2014-03-05"; geçersizse null. */
export function tarihCevir(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  let y: number, a: number, g: number;
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) [y, a, g] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/))) {
    [g, a, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (y < 100) y += y > 50 ? 1900 : 2000;
  } else return null;
  const d = new Date(Date.UTC(y, a - 1, g));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) return null;
  if (y < 1990 || y > 2030) return null;
  return `${y}-${String(a).padStart(2, "0")}-${String(g).padStart(2, "0")}`;
}

/** "1.500,00 ₺", "1500", "1,500.50" → sayı */
export function tutarCevir(s: string): number | null {
  let t = s.replace(/[₺\sTLtl]/g, "");
  if (!t) return null;
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(/,/g, "");
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export type IceAktarSatir = {
  satirNo: number;
  kayit: {
    ad: string; soyad: string; dogum_tarihi: string | null; yas_grubu: string | null; mevki: string | null;
    forma_no: number | null; okul: string | null; veli_ad_soyad: string | null; veli_telefon: string | null;
    veli_eposta: string | null; aylik_aidat: number; notlar: string | null;
  } | null;
  hatalar: string[];
};

export function satirlariHazirla(tablo: string[][]): { eslesme: (AlanAdi | null)[]; satirlar: IceAktarSatir[] } {
  if (tablo.length === 0) return { eslesme: [], satirlar: [] };
  const eslesme = tablo[0].map(basligiEsle);
  const satirlar = tablo.slice(1).map((h, i): IceAktarSatir => {
    const al = (alan: AlanAdi) => {
      const j = eslesme.indexOf(alan);
      return j >= 0 ? (h[j] ?? "").trim() : "";
    };
    const hatalar: string[] = [];
    let ad = al("ad");
    let soyad = al("soyad");
    if ((!ad || !soyad) && al("ad_soyad")) {
      const parca = al("ad_soyad").split(/\s+/);
      soyad = soyad || (parca.length > 1 ? parca.pop()! : "");
      ad = ad || parca.join(" ");
    }
    if (!ad) hatalar.push("Ad yok");
    if (!soyad) hatalar.push("Soyad yok");

    const dogumHam = al("dogum_tarihi");
    const dogum = dogumHam ? tarihCevir(dogumHam) : null;
    if (dogumHam && !dogum) hatalar.push(`Doğum tarihi okunamadı: ${dogumHam}`);

    const aidatHam = al("aylik_aidat");
    const aidat = aidatHam ? tutarCevir(aidatHam) : 0;
    if (aidatHam && aidat === null) hatalar.push(`Aidat okunamadı: ${aidatHam}`);

    const eposta = al("veli_eposta").toLowerCase();
    if (eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) hatalar.push(`E-posta geçersiz: ${eposta}`);

    const formaHam = al("forma_no");
    const forma = formaHam && /^\d{1,3}$/.test(formaHam) ? Number(formaHam) : null;

    const bos = (v: string) => (v ? v : null);
    return {
      satirNo: i + 2,
      hatalar,
      kayit: hatalar.length
        ? null
        : {
            ad, soyad, dogum_tarihi: dogum, yas_grubu: bos(al("yas_grubu")), mevki: bos(al("mevki")),
            forma_no: forma, okul: bos(al("okul")), veli_ad_soyad: bos(al("veli_ad_soyad")),
            veli_telefon: bos(al("veli_telefon")), veli_eposta: bos(eposta), aylik_aidat: aidat ?? 0,
            notlar: bos(al("notlar")),
          },
    };
  });
  return { eslesme, satirlar };
}
