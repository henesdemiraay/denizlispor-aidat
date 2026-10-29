/**
 * iCalendar (RFC 5545) üretimi — antrenman ve maçları telefon takvimine aktarmak için.
 * Türkiye 2016'dan beri yaz saati uygulamıyor (sabit UTC+3); saatler UTC'ye çevrilerek yazılır.
 */
export type TakvimOlayi = {
  uid: string;
  tarih: string; // YYYY-MM-DD
  saat?: string | null; // HH:MM[:SS] (Türkiye saati)
  sureDk?: number | null;
  baslik: string;
  aciklama?: string | null;
  yer?: string | null;
};

const TR_FARK_SAAT = 3;

function iki(n: number) {
  return String(n).padStart(2, "0");
}

function utcDamga(d: Date) {
  return (
    `${d.getUTCFullYear()}${iki(d.getUTCMonth() + 1)}${iki(d.getUTCDate())}` +
    `T${iki(d.getUTCHours())}${iki(d.getUTCMinutes())}00Z`
  );
}

/** RFC 5545 metin kaçışları + 75 sekizliye satır katlama */
function kac(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function katla(satir: string) {
  const parcalar: string[] = [];
  let kalan = satir;
  while (new TextEncoder().encode(kalan).length > 74) {
    let kes = 74;
    while (new TextEncoder().encode(kalan.slice(0, kes)).length > 74) kes--;
    parcalar.push(kalan.slice(0, kes));
    kalan = " " + kalan.slice(kes);
  }
  parcalar.push(kalan);
  return parcalar.join("\r\n");
}

export function takvimOlustur(ad: string, olaylar: TakvimOlayi[]) {
  const simdi = utcDamga(new Date());
  const satirlar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yuva Kulup Altyapi//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${kac(ad)}`,
    "X-WR-TIMEZONE:Europe/Istanbul",
  ];

  for (const o of olaylar) {
    satirlar.push("BEGIN:VEVENT", `UID:${o.uid}`, `DTSTAMP:${simdi}`);
    if (o.saat) {
      const [s, d] = o.saat.split(":").map(Number);
      const [y, a, g] = o.tarih.split("-").map(Number);
      const bas = new Date(Date.UTC(y, a - 1, g, s - TR_FARK_SAAT, d));
      const bit = new Date(bas.getTime() + (o.sureDk ?? 90) * 60000);
      satirlar.push(`DTSTART:${utcDamga(bas)}`, `DTEND:${utcDamga(bit)}`);
    } else {
      const gun = o.tarih.replace(/-/g, "");
      const ertesi = new Date(o.tarih + "T00:00:00Z");
      ertesi.setUTCDate(ertesi.getUTCDate() + 1);
      satirlar.push(
        `DTSTART;VALUE=DATE:${gun}`,
        `DTEND;VALUE=DATE:${ertesi.toISOString().slice(0, 10).replace(/-/g, "")}`,
      );
    }
    satirlar.push(`SUMMARY:${kac(o.baslik)}`);
    if (o.aciklama) satirlar.push(`DESCRIPTION:${kac(o.aciklama)}`);
    if (o.yer) satirlar.push(`LOCATION:${kac(o.yer)}`);
    satirlar.push("BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Hatırlatma", "END:VALARM");
    satirlar.push("END:VEVENT");
  }
  satirlar.push("END:VCALENDAR");
  return satirlar.map(katla).join("\r\n") + "\r\n";
}
