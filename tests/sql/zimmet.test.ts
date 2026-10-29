import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { hataMesaji, kullaniciAc, oturumla, veritabaniKur } from "./kurulum";

let db: PGlite;
let yonetici: string;
let antrenor: string;
let veli: string;
let baskaVeli: string;
let sporcu: string;

beforeAll(async () => {
  db = await veritabaniKur();
  yonetici = await kullaniciAc(db, "yonetim@kulup.test", "yonetici");
  antrenor = await kullaniciAc(db, "antrenor@kulup.test", "antrenor");
  veli = await kullaniciAc(db, "veli@kulup.test", "veli");
  baskaVeli = await kullaniciAc(db, "baska@kulup.test", "veli");
  const r = await db.query<{ id: string }>(
    `insert into spor_sporcular (ad, soyad, durum, veli_id) values ('Ece', 'Demir', 'aktif', $1) returning id`, [veli]);
  sporcu = r.rows[0].id;
});

describe("zimmet", () => {
  it("yönetim verir; antrenör ve veli göremez değiştiremez, ama görür", async () => {
    await oturumla(db, yonetici,
      `insert into spor_zimmetler (sporcu_id, esya, beden, adet, verilis, iade_beklenen) values ($1, 'Maç forması', 'S', 2, '2026-09-01', '2026-11-01')`, [sporcu]);
    expect(await hataMesaji(oturumla(db, antrenor,
      `insert into spor_zimmetler (sporcu_id, esya) values ($1, 'Top')`, [sporcu]))).toMatch(/row-level security/);
    expect(await oturumla(db, antrenor, `select esya from spor_zimmetler`)).toHaveLength(1);
    expect(await oturumla(db, veli, `select esya from spor_zimmetler`)).toHaveLength(1);
    expect(await oturumla(db, baskaVeli, `select esya from spor_zimmetler`)).toHaveLength(0);
    const g = await oturumla<{ n: number }>(db, veli, `with u as (update spor_zimmetler set iade_edildi = '2026-10-01' returning 1) select count(*)::int as n from u`);
    expect(g[0].n).toBe(0);
  });

  it("iade tarihi geçince 1. ve 7. gün veliye birer kez hatırlatma gider", async () => {
    const say = async () =>
      (await db.query(`select 1 from spor_bildirimler where kullanici_id = $1 and tur = 'zimmet_iade'`, [veli])).rows.length;
    await db.query(`select spor_gunluk_isler('2026-11-01')`);
    expect(await say()).toBe(0);
    await db.query(`select spor_gunluk_isler('2026-11-02')`);
    await db.query(`select spor_gunluk_isler('2026-11-02')`);
    expect(await say()).toBe(1);
    const b = await db.query<{ baslik: string }>(`select baslik from spor_bildirimler where tur = 'zimmet_iade'`);
    expect(b.rows[0].baslik).toBe("Ece: 2 adet Maç forması iadesi gecikti");
    await db.query(`select spor_gunluk_isler('2026-11-08')`);
    expect(await say()).toBe(2);
  });

  it("iade edilen eşya için hatırlatma gitmez", async () => {
    await db.query(`update spor_zimmetler set iade_edildi = '2026-11-09'`);
    await db.query(`select spor_gunluk_isler('2026-11-02')`);
    const r = await db.query<{ zimmet: number }>(`select (spor_gunluk_isler('2026-11-08')->>'zimmet')::int as zimmet`);
    expect(r.rows[0].zimmet).toBe(0);
  });
});
