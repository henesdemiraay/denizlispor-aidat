import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { hataMesaji, kullaniciAc, oturumla, veritabaniKur } from "./kurulum";

let db: PGlite;
let yonetici: string;
let baskan: string;
let veli: string;
let veli2: string;
let sporcu: string;

async function kutu(kim: string) {
  return db.query<{ tur: string; baslik: string; govde: string; yol: string }>(
    `select tur, baslik, govde, yol from spor_bildirimler where kullanici_id = $1 order by created_at, baslik`,
    [kim],
  ).then((r) => r.rows);
}

beforeAll(async () => {
  db = await veritabaniKur();
  yonetici = await kullaniciAc(db, "yonetim@kulup.test", "yonetici");
  baskan = await kullaniciAc(db, "baskan@kulup.test", "baskan");
  veli = await kullaniciAc(db, "veli@kulup.test", "veli");
  veli2 = await kullaniciAc(db, "veli2@kulup.test", "veli");
  sporcu = (await db.query<{ id: string }>(
    `insert into spor_sporcular (ad, soyad, veli_id, durum, aylik_aidat) values ('Ada', 'Yıldız', $1, 'pasif', 1500) returning id`,
    [veli],
  )).rows[0].id;
});

describe("sessiz saat", () => {
  it("22:00–08:30 arası sabaha kayar, gündüz aynen kalır", async () => {
    const r = await db.query<{ gece: string; sabah: string; gunduz: string }>(`
      select to_char(spor_bildirim_zamani('2026-11-03 23:15+03') at time zone 'Europe/Istanbul', 'YYYY-MM-DD HH24:MI') as gece,
             to_char(spor_bildirim_zamani('2026-11-04 06:00+03') at time zone 'Europe/Istanbul', 'YYYY-MM-DD HH24:MI') as sabah,
             to_char(spor_bildirim_zamani('2026-11-04 14:00+03') at time zone 'Europe/Istanbul', 'YYYY-MM-DD HH24:MI') as gunduz`);
    expect(r.rows[0]).toEqual({ gece: "2026-11-04 08:30", sabah: "2026-11-04 08:30", gunduz: "2026-11-04 14:00" });
  });
});

describe("aidat hatırlatmaları", () => {
  it("vadeden 3 gün önce, vade günü ve gecikmenin 3. günü; tekrar yazılmaz; kısmi ödemede kalan yazılır", async () => {
    const aidat = (await db.query<{ id: string }>(
      `insert into spor_aidatlar (sporcu_id, donem, tutar, son_odeme_tarihi) values ($1, '2026-11-01', 1500, '2026-11-10') returning id`,
      [sporcu],
    )).rows[0].id;
    await db.query(`insert into spor_odemeler (aidat_id, sporcu_id, tutar, durum) values ($1, $2, 500, 'onaylandi')`, [aidat, sporcu]);

    const gun = async (g: string) =>
      (await db.query<{ r: { hatirlatma: number } }>(`select spor_gunluk_isler($1) as r`, [g])).rows[0].r.hatirlatma;
    expect(await gun("2026-11-06")).toBe(0); // 4 gün önce: kural yok
    expect(await gun("2026-11-07")).toBe(1); // 3 gün önce
    expect(await gun("2026-11-07")).toBe(0); // aynı gün tekrar yok
    expect(await gun("2026-11-10")).toBe(1); // vade günü
    expect(await gun("2026-11-13")).toBe(1); // 3 gün gecikme
    expect(await gun("2026-11-20")).toBe(1); // 10 gün gecikme

    const k = await kutu(veli);
    expect(k.map((b) => b.tur)).toEqual(["aidat_yaklasiyor", "aidat_bugun", "aidat_gecikti", "aidat_gecikti"]);
    expect(k[0].baslik).toBe("Kasım 2026 aidatı · 3 gün kaldı");
    expect(k[0].govde).toBe("Ada için ₺1.000,00 ödenecek. Son ödeme: 10.11.2026.");
    expect(k[2].baslik).toBe("Kasım 2026 aidatı 3 gün gecikti");
    expect(k.every((b) => b.yol === "/panel/aidat")).toBe(true);
  });

  it("hatırlatma kapatılabilir ve kural günleri ayarlanabilir", async () => {
    await db.query(`insert into spor_ayarlar (anahtar, deger) values ('hatirlatma_once', '1, 5') on conflict (anahtar) do update set deger = excluded.deger`);
    const aidat2 = (await db.query<{ id: string }>(
      `insert into spor_aidatlar (sporcu_id, donem, tutar, son_odeme_tarihi) values ($1, '2026-12-01', 1500, '2026-12-10') returning id`,
      [sporcu],
    )).rows[0].id;
    expect((await db.query<{ r: { hatirlatma: number } }>(`select spor_gunluk_isler('2026-12-05') as r`)).rows[0].r.hatirlatma).toBe(1);
    await db.query(`insert into spor_ayarlar (anahtar, deger) values ('hatirlatma', 'kapali') on conflict (anahtar) do update set deger = excluded.deger`);
    expect((await db.query<{ r: { hatirlatma: number } }>(`select spor_gunluk_isler('2026-12-09') as r`)).rows[0].r.hatirlatma).toBe(0);
    await db.query(`delete from spor_aidatlar where id = $1`, [aidat2]);
    await db.query(`delete from spor_ayarlar where anahtar in ('hatirlatma', 'hatirlatma_once')`);
  });
});

describe("olay bildirimleri", () => {
  it("kayıt başvurusu yönetime ve başkana; onay veliye", async () => {
    await db.query(`update spor_sporcular set durum = 'onay_bekliyor' where id = $1`, [sporcu]);
    for (const kim of [yonetici, baskan]) {
      expect((await kutu(kim)).map((b) => b.tur)).toContain("yeni_kayit");
    }
    await db.query(`update spor_sporcular set durum = 'aktif' where id = $1`, [sporcu]);
    const k = await kutu(veli);
    expect(k.at(-1)).toMatchObject({ tur: "kayit_onaylandi", baslik: "Ada kulübe kaydedildi" });
  });

  it("ödeme bildirimi yönetime, karar bildirene gider", async () => {
    const aidat = (await db.query<{ id: string }>(`select id from spor_aidatlar where sporcu_id = $1 and donem = '2026-11-01'`, [sporcu])).rows[0].id;
    const odeme = (await db.query<{ id: string }>(
      `insert into spor_odemeler (aidat_id, sporcu_id, tutar, durum, bildiren_id) values ($1, $2, 1000, 'beklemede', $3) returning id`,
      [aidat, sporcu, veli],
    )).rows[0].id;
    expect((await kutu(yonetici)).map((b) => b.baslik)).toContain("Yeni ödeme bildirimi · ₺1.000,00");
    await db.query(`update spor_odemeler set durum = 'onaylandi' where id = $1`, [odeme]);
    expect((await kutu(veli)).at(-1)).toMatchObject({ tur: "odeme_onaylandi", baslik: "Ödemeniz onaylandı · ₺1.000,00" });
  });

  it("'gelmedi' yalnızca güncel antrenmanda veliye gider", async () => {
    const bugun = (await db.query<{ d: string }>(`select ((now() at time zone 'Europe/Istanbul')::date)::text as d`)).rows[0].d;
    const yeni = (await db.query<{ id: string }>(`insert into spor_antrenmanlar (tarih, baslik) values ($1, 'Pas çalışması') returning id`, [bugun])).rows[0].id;
    const eski = (await db.query<{ id: string }>(`insert into spor_antrenmanlar (tarih, baslik) values ('2026-01-05', 'Eski') returning id`)).rows[0].id;
    const once = (await kutu(veli)).length;
    await db.query(`insert into spor_yoklama (antrenman_id, sporcu_id, durum) values ($1, $2, 'gelmedi')`, [eski, sporcu]);
    expect((await kutu(veli)).length).toBe(once);
    await db.query(`insert into spor_yoklama (antrenman_id, sporcu_id, durum) values ($1, $2, 'geldi')`, [yeni, sporcu]);
    expect((await kutu(veli)).length).toBe(once);
    await db.query(`update spor_yoklama set durum = 'gelmedi' where antrenman_id = $1`, [yeni]);
    expect((await kutu(veli)).at(-1)).toMatchObject({ tur: "yoklama_gelmedi", baslik: "Ada antrenmana katılmadı" });
  });
});

describe("erişim", () => {
  it("anlık bildirim gece de kutuda hemen görünür; dış gönderim sabaha kayar", async () => {
    await db.query(`select spor_bildirim_yaz($1, 'odeme_onaylandi', 'Gece', null, '/panel/aidat', 'gece-1', '2026-11-03 23:15+03')`, [veli2]);
    const g = await db.query<{ g: string; d: string }>(
      `select to_char(gorunur_zaman at time zone 'Europe/Istanbul', 'HH24:MI') as g, to_char(dis_gonderim at time zone 'Europe/Istanbul', 'DD HH24:MI') as d from spor_bildirimler where anahtar = 'gece-1'`,
    );
    expect(g.rows[0]).toEqual({ g: "23:15", d: "04 08:30" });
    await db.query(`delete from spor_bildirimler where anahtar = 'gece-1'`);
  });

  it("herkes yalnızca kendi kutusunu görür; okundu yalnızca kendi kaydına", async () => {
    // Gelecek tarihli hatırlatmaları (sınama günleri) görünür yap
    await db.query(`update spor_bildirimler set gorunur_zaman = now() - interval '1 minute' where kullanici_id = $1`, [veli]);
    const kendi = await oturumla<{ kullanici_id: string }>(db, veli, `select kullanici_id from spor_bildirimler`);
    expect(kendi.length).toBeGreaterThan(0);
    expect(kendi.every((b) => b.kullanici_id === veli)).toBe(true);
    expect(await oturumla(db, veli2, `select * from spor_bildirimler`)).toEqual([]);

    const [{ n }] = await oturumla<{ n: number }>(db, veli2, `select spor_bildirim_okundu() as n`);
    expect(n).toBe(0);
    const [{ m }] = await oturumla<{ m: number }>(db, veli, `select spor_bildirim_okundu() as m`);
    expect(m).toBeGreaterThan(0);
  });

  it("kimse doğrudan bildirim yazamaz ya da başkası adına üretemez", async () => {
    expect(await hataMesaji(oturumla(db, yonetici,
      `insert into spor_bildirimler (kullanici_id, tur, baslik, anahtar) values ($1, 'duyuru', 'x', 'x')`, [veli]))).toMatch(/permission denied/);
    expect(await hataMesaji(oturumla(db, yonetici,
      `select spor_bildirim_yaz($1, 'aidat_bugun', 'x', 'x', '/', 'y')`, [veli]))).toMatch(/permission denied/);
    expect(await hataMesaji(oturumla(db, veli, `select spor_aidat_hatirlatmalari()`))).toMatch(/permission denied/);
  });

  it("sessiz saatte üretilen bildirim sabaha kadar görünmez", async () => {
    await db.query(
      `insert into spor_bildirimler (kullanici_id, tur, baslik, anahtar, gorunur_zaman) values ($1, 'aidat_bugun', 'Gelecek', 'gelecek', now() + interval '5 hours')`,
      [veli2],
    );
    expect(await oturumla(db, veli2, `select * from spor_bildirimler`)).toEqual([]);
  });
});
