import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { GOCLER, gocOku, hataMesaji, kullaniciAc, oturumla, veritabaniKur } from "./kurulum";

let db: PGlite;
let yonetici: string;
let veli1: string;
let veli2: string;
let antrenor: string;
let cocuk1: string;

beforeAll(async () => {
  db = await veritabaniKur();
  yonetici = await kullaniciAc(db, "yonetim@kulup.test", "yonetici");
  veli1 = await kullaniciAc(db, "veli1@kulup.test", "veli");
  veli2 = await kullaniciAc(db, "veli2@kulup.test", "veli");
  antrenor = await kullaniciAc(db, "antrenor@kulup.test", "antrenor");
  cocuk1 = (await db.query<{ id: string }>(
    `insert into spor_sporcular (ad, soyad, veli_id, yas_grubu) values ('Çocuk', 'Bir', $1, 'U12') returning id`,
    [veli1],
  )).rows[0].id;
  await db.query(`insert into spor_sporcular (ad, soyad, veli_id, yas_grubu) values ('Çocuk', 'İki', $1, 'U12')`, [veli2]);
});

describe("taban şema ve göç zinciri", () => {
  it("göçler boş veritabanına tarih sırasıyla uygulanır; taban ilk sırada", () => {
    expect(GOCLER[0]).toBe("00000000_taban.sql");
    expect(GOCLER.length).toBeGreaterThanOrEqual(3);
  });

  it("taban sonrası göçler tekrar çalıştırılabilir", async () => {
    for (const g of GOCLER.slice(1)) await db.exec(gocOku(g));
  });

  it("tüm spor_ tablolarında RLS açık", async () => {
    const r = await db.query<{ tablo: string }>(
      `select c.relname as tablo from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'spor\\_%' and not c.relrowsecurity`,
    );
    expect(r.rows).toEqual([]);
  });

  it("girişsiz (anon) hiçbir spor_ tablosunu okuyamaz", async () => {
    const { rows } = await db.query<{ tablo: string }>(
      `select tablename as tablo from pg_tables where schemaname = 'public' and tablename like 'spor\\_%'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(19);
    for (const { tablo } of rows) {
      const m = await hataMesaji(oturumla(db, null, `select 1 from public.${tablo} limit 1`, [], "anon"));
      expect(m, tablo).toMatch(/permission denied/);
    }
  });

  it("veli yalnızca kendi çocuğunu görür; personel hepsini", async () => {
    expect(await oturumla(db, veli1, `select id from spor_sporcular`)).toEqual([{ id: cocuk1 }]);
    expect(await oturumla(db, antrenor, `select id from spor_sporcular`)).toHaveLength(2);
  });

  it("veli kendi rolünü yükseltemez", async () => {
    await oturumla(db, veli1, `update spor_profiller set rol = 'yonetici' where id = $1`, [veli1]);
    const r = await db.query<{ rol: string }>(`select rol from spor_profiller where id = $1`, [veli1]);
    expect(r.rows[0].rol).toBe("veli");
  });

  it("veli başka çocuğun aidatını göremez", async () => {
    await db.query(`insert into spor_aidatlar (sporcu_id, donem, tutar) select id, '2026-10-01', 500 from spor_sporcular`);
    expect(await oturumla(db, veli1, `select sporcu_id from spor_aidatlar`)).toEqual([{ sporcu_id: cocuk1 }]);
    expect(await oturumla(db, yonetici, `select sporcu_id from spor_aidatlar`)).toHaveLength(2);
  });
});
