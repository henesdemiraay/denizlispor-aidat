import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { hataMesaji, kullaniciAc, oturumla, veritabaniKur } from "./kurulum";

let db: PGlite;
let yonetici: string;
let veli: string;

async function ayar(anahtar: string, deger: string | null) {
  if (deger === null) await db.query(`delete from spor_ayarlar where anahtar = $1`, [anahtar]);
  else
    await db.query(
      `insert into spor_ayarlar (anahtar, deger) values ($1, $2) on conflict (anahtar) do update set deger = excluded.deger`,
      [anahtar, deger],
    );
}

/** Tetikleyici çalışmasın diye sporcuyu önce pasif ekler; sonra alanları doldurur. */
async function sporcu(alanlar: Record<string, unknown>) {
  const tum = { ad: "S", soyad: "S", aylik_aidat: 1000, durum: "pasif", kayit_tarihi: "2026-01-01", ...alanlar };
  const anahtarlar = Object.keys(tum);
  const { rows } = await db.query<{ id: string }>(
    `insert into spor_sporcular (${anahtarlar.join(", ")}) values (${anahtarlar.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
    Object.values(tum),
  );
  return rows[0].id;
}

async function hesapla(id: string, donem: string, baslangic: string | null = null) {
  const { rows } = await db.query<{ tutar: string; aciklama: string | null }>(
    `select tutar, aciklama from spor_aidat_hesapla($1, $2, $3)`,
    [id, donem, baslangic],
  );
  return rows.map((r) => ({ tutar: Number(r.tutar), aciklama: r.aciklama }));
}

beforeAll(async () => {
  db = await veritabaniKur();
  yonetici = await kullaniciAc(db, "yonetim@kulup.test", "yonetici");
  veli = await kullaniciAc(db, "veli@kulup.test", "veli");
});

beforeEach(async () => {
  await db.query(`delete from spor_aidatlar`);
  await db.query(`delete from spor_sporcular`);
  for (const a of ["kardes_indirimi", "kist_hesap", "son_odeme_gunu", "otomatik_tahakkuk", "son_otomatik_tahakkuk"]) await ayar(a, null);
});

describe("aidat hesabı", () => {
  it("indirimsiz tam tutar", async () => {
    const id = await sporcu({});
    expect(await hesapla(id, "2026-11-01")).toEqual([{ tutar: 1000, aciklama: null }]);
  });

  it("sporcuya özel indirim ve nedeni", async () => {
    const id = await sporcu({ indirim_orani: 25, indirim_nedeni: "Şehit yakını" });
    expect(await hesapla(id, "2026-11-01")).toEqual([{ tutar: 750, aciklama: "Şehit yakını %25" }]);
  });

  it("kardeş indirimi yalnızca ikinci ve sonraki kardeşe; büyük olan indirim uygulanır, toplanmaz", async () => {
    await ayar("kardes_indirimi", "20");
    const buyuk = await sporcu({ veli_id: veli, durum: "aktif", kayit_tarihi: "2025-09-01", aylik_aidat: 0 });
    await db.query(`update spor_sporcular set aylik_aidat = 1000 where id = $1`, [buyuk]);
    const kucuk = await sporcu({ veli_id: veli, kayit_tarihi: "2026-02-01" });
    const ucuncu = await sporcu({ veli_id: veli, kayit_tarihi: "2026-03-01", indirim_orani: 50, indirim_nedeni: "Burs" });
    expect(await hesapla(buyuk, "2026-11-01")).toEqual([{ tutar: 1000, aciklama: null }]);
    expect(await hesapla(kucuk, "2026-11-01")).toEqual([{ tutar: 800, aciklama: "Kardeş indirimi %20" }]);
    expect(await hesapla(ucuncu, "2026-11-01")).toEqual([{ tutar: 500, aciklama: "Burs %50" }]);
  });

  it("kıst: ay ortası başlangıçta kalan günler, tam TL yukarı", async () => {
    await ayar("kist_hesap", "acik");
    const id = await sporcu({ kayit_tarihi: "2026-11-16" });
    // 30 günlük ayın 16'sı → 15 gün: 1000 × 15/30 = 500
    expect(await hesapla(id, "2026-11-01")).toEqual([{ tutar: 500, aciklama: "Kıst 15/30 gün" }]);
    // sonraki ay tam
    expect(await hesapla(id, "2026-12-01")).toEqual([{ tutar: 1000, aciklama: null }]);
    await ayar("kist_hesap", "kapali");
    expect(await hesapla(id, "2026-11-01")).toEqual([{ tutar: 1000, aciklama: null }]);
  });

  it("dondurma: ayın tamamı dondurulmuşsa borç yok, kısmi ayda tam borç", async () => {
    const id = await sporcu({ dondurma_bas: "2026-11-01", dondurma_bit: "2026-12-31" });
    expect(await hesapla(id, "2026-11-01")).toEqual([]);
    expect(await hesapla(id, "2026-12-01")).toEqual([]);
    expect(await hesapla(id, "2027-01-01")).toHaveLength(1);
    const kismi = await sporcu({ dondurma_bas: "2026-11-10", dondurma_bit: "2026-11-20" });
    expect(await hesapla(kismi, "2026-11-01")).toEqual([{ tutar: 1000, aciklama: null }]);
  });

  it("dondurma tarihleri ters girilemez", async () => {
    expect(await hataMesaji(sporcu({ dondurma_bas: "2026-12-01", dondurma_bit: "2026-11-01" }))).toMatch(/dondurma_check/);
    expect(await hataMesaji(sporcu({ indirim_orani: 120 }))).toMatch(/indirim_check/);
  });
});

describe("tahakkuk", () => {
  it("dönem oluşturma hesabı kullanır; %100 indirim 'muaf' açılır; dondurulan atlanır", async () => {
    await ayar("son_odeme_gunu", "5");
    await sporcu({ durum: "aktif", aylik_aidat: 0, ad: "Tam" }).then((id) => db.query(`update spor_sporcular set aylik_aidat = 1000 where id = $1`, [id]));
    await db.query(`delete from spor_aidatlar`);
    await sporcu({ durum: "pasif", ad: "Burslu", indirim_orani: 100, indirim_nedeni: "Tam burs" }).then((id) =>
      db.query(`update spor_sporcular set durum = 'aktif' where id = $1`, [id]),
    );
    await sporcu({ durum: "pasif", ad: "Donuk", dondurma_bas: "2026-11-01" }).then((id) =>
      db.query(`update spor_sporcular set durum = 'aktif' where id = $1`, [id]),
    );
    await db.query(`delete from spor_aidatlar`);

    const [{ n }] = await oturumla<{ n: number }>(db, yonetici, `select spor_donem_olustur('2026-11-01') as n`);
    expect(n).toBe(2);
    const { rows } = await db.query<{ ad: string; tutar: string; durum: string; son_odeme_tarihi: string; aciklama: string | null }>(
      `select s.ad, a.tutar, a.durum, a.son_odeme_tarihi::text, a.aciklama from spor_aidatlar a join spor_sporcular s on s.id = a.sporcu_id order by s.ad`,
    );
    expect(rows).toEqual([
      { ad: "Burslu", tutar: "0.00", durum: "muaf", son_odeme_tarihi: "2026-11-05", aciklama: "Tam burs %100" },
      { ad: "Tam", tutar: "1000.00", durum: "bekliyor", son_odeme_tarihi: "2026-11-05", aciklama: null },
    ]);

    // Eksik listesi dondurulanı saymaz
    expect(await oturumla(db, yonetici, `select * from spor_eksik_tahakkuk('2026-11-01')`)).toEqual([]);
  });

  it("otomatik tahakkuk ayda bir kez; silinen borç aynı ay yeniden açılmaz; kapatılabilir", async () => {
    const id = await sporcu({});
    await db.query(`update spor_sporcular set durum = 'aktif' where id = $1`, [id]);
    await db.query(`delete from spor_aidatlar`);

    const ilk = await db.query<{ r: { tahakkuk: number } }>(`select spor_gunluk_isler('2026-12-01') as r`);
    expect(ilk.rows[0].r.tahakkuk).toBe(1);
    await db.query(`delete from spor_aidatlar`);
    const ikinci = await db.query<{ r: { tahakkuk: number } }>(`select spor_gunluk_isler('2026-12-15') as r`);
    expect(ikinci.rows[0].r.tahakkuk).toBe(0);

    await ayar("otomatik_tahakkuk", "kapali");
    const kapali = await db.query<{ r: { tahakkuk: number } }>(`select spor_gunluk_isler('2027-01-01') as r`);
    expect(kapali.rows[0].r.tahakkuk).toBe(0);
  });

  it("otomatik iş ve iç hesap uygulamadan çağrılamaz", async () => {
    expect(await hataMesaji(oturumla(db, yonetici, `select spor_gunluk_isler()`))).toMatch(/permission denied/);
    expect(await hataMesaji(oturumla(db, yonetici, `select * from spor_aidat_hesapla(gen_random_uuid(), current_date)`))).toMatch(/permission denied/);
    // Önizleme yalnızca yönetime veri döndürür
    const id = await sporcu({});
    expect(await oturumla(db, veli, `select * from spor_aidat_onizle($1)`, [id])).toEqual([]);
    expect(await oturumla(db, yonetici, `select tutar from spor_aidat_onizle($1)`, [id])).toHaveLength(1);
  });

  it("aktifleştirmede kıst ve indirim açıklamaya yazılır", async () => {
    await ayar("kist_hesap", "acik");
    const id = await sporcu({ indirim_orani: 10, indirim_nedeni: "Erken kayıt" });
    await db.query(`update spor_sporcular set durum = 'aktif' where id = $1`, [id]);
    const { rows } = await db.query<{ aciklama: string }>(`select aciklama from spor_aidatlar where sporcu_id = $1`, [id]);
    expect(rows[0].aciklama).toMatch(/^Kayıt onayında oluşturuldu · Erken kayıt %10/);
  });

  it("kısmi ödeme: onaylı ödemeler toplamı tutara ulaşınca aidat kapanır", async () => {
    const id = await sporcu({});
    const { rows } = await db.query<{ id: string }>(
      `insert into spor_aidatlar (sporcu_id, donem, tutar) values ($1, '2026-11-01', 1000) returning id`,
      [id],
    );
    const aidat = rows[0].id;
    await db.query(`insert into spor_odemeler (aidat_id, sporcu_id, tutar, durum) values ($1, $2, 400, 'onaylandi')`, [aidat, id]);
    expect((await db.query<{ durum: string }>(`select durum from spor_aidatlar where id = $1`, [aidat])).rows[0].durum).toBe("bekliyor");
    await db.query(`insert into spor_odemeler (aidat_id, sporcu_id, tutar, durum) values ($1, $2, 600, 'onaylandi')`, [aidat, id]);
    expect((await db.query<{ durum: string }>(`select durum from spor_aidatlar where id = $1`, [aidat])).rows[0].durum).toBe("odendi");
  });
});
