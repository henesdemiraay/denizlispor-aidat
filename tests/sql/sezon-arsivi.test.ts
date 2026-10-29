import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { hataMesaji, kullaniciAc, oturumla, veritabaniKur } from "./kurulum";

let db: PGlite;
const kim: Record<"yonetici" | "antrenor" | "veli", string> = { yonetici: "", antrenor: "", veli: "" };

/** Uygulamadaki gibi: verilen roldeki kullanıcının oturumunda sorgu */
function olarak<T = Record<string, unknown>>(rol: keyof typeof kim, sql: string, params: unknown[] = []) {
  return oturumla<T>(db, kim[rol], sql, params);
}

let sporcuA: string;
let sporcuB: string;
let eskiMac: string;
let eskiAntrenman: string;

beforeAll(async () => {
  db = await veritabaniKur();
  kim.yonetici = await kullaniciAc(db, "yonetim@kulup.test", "yonetici");
  kim.antrenor = await kullaniciAc(db, "antrenor@kulup.test", "antrenor");
  kim.veli = await kullaniciAc(db, "veli@kulup.test", "veli");
  sporcuA = (await db.query<{ id: string }>(
    `insert into spor_sporcular (ad, soyad, yas_grubu, forma_no) values ('A', 'A', 'U12', 9) returning id`,
  )).rows[0].id;
  sporcuB = (await db.query<{ id: string }>(
    `insert into spor_sporcular (ad, soyad, yas_grubu, forma_no) values ('B', 'B', 'U12', 4) returning id`,
  )).rows[0].id;

  // 2024–25 sezonu (bitmiş): iki maç, bir antrenman
  eskiMac = (await db.query<{ id: string }>(
    `insert into spor_maclar (tarih, rakip, yas_grubu, skor_biz, skor_rakip) values ('2024-10-05', 'Rakip', 'U12', 3, 1) returning id`,
  )).rows[0].id;
  await db.query(`insert into spor_maclar (tarih, rakip, yas_grubu, skor_biz, skor_rakip) values ('2025-03-01', 'Rakip', 'U12', 0, 0)`);
  await db.query(
    `insert into spor_mac_katilim (mac_id, sporcu_id, dakika, ilk_onbir, gol, asist) values ($1, $2, 60, true, 2, 0), ($1, $3, 30, false, 0, 1)`,
    [eskiMac, sporcuA, sporcuB],
  );
  eskiAntrenman = (await db.query<{ id: string }>(
    `insert into spor_antrenmanlar (tarih, sure_dk, yas_grubu, baslik) values ('2025-05-10', 90, 'U12', 'Pas') returning id`,
  )).rows[0].id;
  await db.query(
    `insert into spor_yoklama (antrenman_id, sporcu_id, durum) values ($1, $2, 'geldi'), ($1, $3, 'gelmedi')`,
    [eskiAntrenman, sporcuA, sporcuB],
  );
  // Bu sezon (2026–27, sürüyor)
  await db.query(`insert into spor_maclar (tarih, rakip, skor_biz, skor_rakip) values ('2026-10-10', 'Rakip', 1, 2)`);
});

describe("sezon yardımcıları", () => {
  it("sezon Eylül'de başlar", async () => {
    const r = await db.query<{ a: number; b: number; ad: string }>(
      `select spor_sezon_yili('2025-08-31') a, spor_sezon_yili('2025-09-01') b, spor_sezon_adi(2025) ad`,
    );
    expect(r.rows[0]).toEqual({ a: 2024, b: 2025, ad: "2025–26" });
  });
});

describe("sezon özeti", () => {
  it("maç, gol, devam ve kadroyu sayar; ad soyad tutmaz", async () => {
    const [{ ozet }] = await olarak<{ ozet: Record<string, unknown> }>(
      "antrenor",
      `select spor_sezon_ozeti(2024) as ozet`,
    );
    expect(ozet).toMatchObject({
      sezon: 2024,
      ad: "2024–25",
      mac: 2,
      galibiyet: 1,
      beraberlik: 1,
      maglubiyet: 0,
      gol_atilan: 3,
      gol_yenilen: 1,
      antrenman: 1,
      antrenman_dk: 90,
      devam_orani: 50,
      yas_gruplari: ["U12"],
      sporcu: 2,
    });
    const kadro = ozet.kadro as Record<string, unknown>[];
    expect(kadro[0]).toMatchObject({ sporcu_id: sporcuA, mac: 1, dakika: 60, gol: 2, antrenman_geldi: 1, antrenman_sayilan: 1 });
    expect(JSON.stringify(ozet)).not.toMatch(/"ad":"A"|soyad/);
  });

  it("veli özet alamaz", async () => {
    expect(await hataMesaji(olarak("veli", `select spor_sezon_ozeti(2024)`))).toMatch(/personeli/);
  });
});

describe("mühürleme", () => {
  it("biten sezonu yalnızca yönetim mühürler; süren sezon mühürlenemez", async () => {
    expect(await hataMesaji(olarak("antrenor", `select spor_sezon_muhurle(2024, null)`))).toMatch(/yönetimi/);
    expect(await hataMesaji(olarak("yonetici", `select spor_sezon_muhurle(2026, null)`))).toMatch(/henüz bitmedi/);

    await olarak("yonetici", `select spor_sezon_muhurle(2024, 'Harika bir ilk sezon')`);
    const [s] = await olarak<{ durum: string; kapanis_notu: string; gecmis: unknown[]; ozet: { mac: number } }>(
      "veli",
      `select durum, kapanis_notu, gecmis, ozet from spor_sezonlar where yil = 2024`,
    );
    expect(s.durum).toBe("muhurlu");
    expect(s.kapanis_notu).toBe("Harika bir ilk sezon");
    expect(s.ozet.mac).toBe(2);
    expect(s.gecmis).toHaveLength(1);

    expect(await hataMesaji(olarak("yonetici", `select spor_sezon_muhurle(2024, null)`))).toMatch(/zaten mühürlü/);
  });

  it("veli sezon tablosuna doğrudan yazamaz", async () => {
    expect(await hataMesaji(olarak("veli", `insert into spor_sezonlar (yil) values (2023)`))).toMatch(/row-level security|permission/);
    expect(await hataMesaji(olarak("yonetici", `update spor_sezonlar set durum = 'acik' where yil = 2024 returning yil`).then((r) => {
      if (r.length === 0) throw new Error("satır değişmedi");
    }))).toMatch(/permission|satır değişmedi/);
  });

  it("mühürlü sezonun maç, kadro, antrenman ve yoklaması değişmez", async () => {
    const kilitli = /mühürlendi/;
    expect(await hataMesaji(olarak("yonetici", `update spor_maclar set skor_biz = 9 where id = $1`, [eskiMac]))).toMatch(kilitli);
    expect(await hataMesaji(olarak("yonetici", `delete from spor_maclar where id = $1`, [eskiMac]))).toMatch(kilitli);
    expect(await hataMesaji(olarak("yonetici", `insert into spor_maclar (tarih, rakip) values ('2025-01-01', 'Rakip')`))).toMatch(kilitli);
    // Bugünkü maçı mühürlü sezona taşımak da yasak
    expect(await hataMesaji(olarak("yonetici", `update spor_maclar set tarih = '2025-01-01' where tarih = '2026-10-10'`))).toMatch(kilitli);
    expect(await hataMesaji(olarak("yonetici", `update spor_mac_katilim set gol = 5 where mac_id = $1`, [eskiMac]))).toMatch(kilitli);
    expect(await hataMesaji(olarak("antrenor", `update spor_yoklama set durum = 'geldi' where antrenman_id = $1`, [eskiAntrenman]))).toMatch(kilitli);
    expect(await hataMesaji(olarak("yonetici", `delete from spor_antrenmanlar where id = $1`, [eskiAntrenman]))).toMatch(kilitli);
    expect(await hataMesaji(olarak("antrenor", `update spor_antrenmanlar set baslik = 'x' where id = $1`, [eskiAntrenman]))).toMatch(kilitli);

    // Süren sezon serbest
    await olarak("yonetici", `update spor_maclar set skor_biz = 2 where tarih = '2026-10-10'`);
  });

  it("sporcu silinince (KVKK) mühürlü sezondaki bağlı kayıtları da silinir", async () => {
    await db.query(`delete from spor_sporcular where id = $1`, [sporcuB]);
    const r = await db.query<{ n: number }>(
      `select (select count(*) from spor_mac_katilim where sporcu_id = $1) + (select count(*) from spor_yoklama where sporcu_id = $1) as n`,
      [sporcuB],
    );
    expect(Number(r.rows[0].n)).toBe(0);
  });

  it("mühür gerekçeyle açılır, geçmişe yazılır; sonra kayıt düzeltilebilir", async () => {
    expect(await hataMesaji(olarak("yonetici", `select spor_sezon_muhur_ac(2024, 'yok')`))).toMatch(/gerekçe/);
    expect(await hataMesaji(olarak("antrenor", `select spor_sezon_muhur_ac(2024, 'skor yanlış girilmiş')`))).toMatch(/yönetimi/);
    await olarak("yonetici", `select spor_sezon_muhur_ac(2024, 'skor yanlış girilmiş')`);
    await olarak("yonetici", `update spor_maclar set skor_biz = 4 where id = $1`, [eskiMac]);

    const [s] = await olarak<{ durum: string; gecmis: { islem: string; neden?: string }[] }>(
      "yonetici",
      `select durum, gecmis from spor_sezonlar where yil = 2024`,
    );
    expect(s.durum).toBe("acik");
    expect(s.gecmis.map((g) => g.islem)).toEqual(["muhurle", "muhur_ac"]);
    expect(s.gecmis[1].neden).toBe("skor yanlış girilmiş");

    // Yeniden mühürleme özeti tazeler, eski notu korur
    await olarak("yonetici", `select spor_sezon_muhurle(2024, null)`);
    const [t] = await olarak<{ kapanis_notu: string; ozet: { gol_atilan: number } }>(
      "veli",
      `select kapanis_notu, ozet from spor_sezonlar where yil = 2024`,
    );
    expect(t.kapanis_notu).toBe("Harika bir ilk sezon");
    expect(t.ozet.gol_atilan).toBe(4);
  });
});

describe("anılar ve yükselenler", () => {
  it("antrenör anı ekler, veli ekleyemez; silme yalnızca yönetimde", async () => {
    await olarak("antrenor", `insert into spor_sezon_anilari (sezon_yil, baslik) values (2024, 'Sezon sonu fotoğrafı')`);
    expect(await hataMesaji(olarak("veli", `insert into spor_sezon_anilari (sezon_yil, baslik) values (2024, 'x x')`))).toMatch(/row-level security/);
    expect(await olarak("veli", `select baslik from spor_sezon_anilari`)).toHaveLength(1);

    const silinen = await olarak("antrenor", `delete from spor_sezon_anilari returning id`);
    expect(silinen).toHaveLength(0);
    expect(await olarak("yonetici", `delete from spor_sezon_anilari returning id`)).toHaveLength(1);
  });

  it("yükselenleri yalnızca yönetim yazar, herkes görür", async () => {
    expect(await hataMesaji(olarak("antrenor",
      `insert into spor_yukselenler (ad_soyad, sezon_yil, hedef) values ('Ali Veli', 2024, 'A Takım')`))).toMatch(/row-level security/);
    await olarak("yonetici",
      `insert into spor_yukselenler (sporcu_id, ad_soyad, sezon_yil, hedef) values ($1, 'Ali Veli', 2024, 'A Takım')`, [sporcuA]);
    expect(await olarak("veli", `select ad_soyad from spor_yukselenler`)).toEqual([{ ad_soyad: "Ali Veli" }]);
  });

  it("arşiv kovası: okuma herkese, yükleme personele, silme yönetime", async () => {
    const r = await db.query(`select id, public from storage.buckets where id = 'spor-arsiv'`);
    expect(r.rows).toEqual([{ id: "spor-arsiv", public: false }]);
    expect(await hataMesaji(olarak("veli", `insert into storage.objects (bucket_id, name) values ('spor-arsiv', '2024/x.jpg')`))).toMatch(/row-level security/);
    await olarak("antrenor", `insert into storage.objects (bucket_id, name) values ('spor-arsiv', '2024/x.jpg')`);
    expect(await olarak("veli", `select name from storage.objects where bucket_id = 'spor-arsiv'`)).toHaveLength(1);
    expect(await olarak("antrenor", `delete from storage.objects where bucket_id = 'spor-arsiv' returning id`)).toHaveLength(0);
    expect(await olarak("yonetici", `delete from storage.objects where bucket_id = 'spor-arsiv' returning id`)).toHaveLength(1);
  });

  it("anon hiçbir şeye erişemez", async () => {
    const m = await hataMesaji(
      oturumla(db, null, "select * from spor_sezonlar", [], "anon"),
    );
    expect(m).toMatch(/permission denied/);
    const f = await hataMesaji(
      oturumla(db, null, "select spor_sezon_muhurle(2024, null)", [], "anon"),
    );
    expect(f).toMatch(/permission denied/);
  });
});
