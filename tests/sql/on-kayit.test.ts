import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { hataMesaji, kullaniciAc, oturumla, veritabaniKur } from "./kurulum";

let db: PGlite;
let yonetici: string;
let antrenor: string;
let veli: string;
let aday: string;

beforeAll(async () => {
  db = await veritabaniKur();
  yonetici = await kullaniciAc(db, "yonetim@kulup.test", "yonetici");
  antrenor = await kullaniciAc(db, "antrenor@kulup.test", "antrenor");
  veli = await kullaniciAc(db, "veli@kulup.test", "veli");
  // Veli uygulamadan başvurur
  const [{ id }] = await oturumla<{ id: string }>(
    db, veli,
    `select spor_sporcu_on_kayit('Deniz', 'Kaya', '2016-04-01', null, null, null, 'Veli Kaya', '0555', null, null, 'Hafta sonu uygun', null) as id`,
  );
  aday = id;
});

describe("ön kayıt", () => {
  it("başvuru onay bekler ve yönetime bildirim düşer", async () => {
    const r = await db.query<{ durum: string; veli_id: string }>(`select durum, veli_id from spor_sporcular where id = $1`, [aday]);
    expect(r.rows[0]).toEqual({ durum: "onay_bekliyor", veli_id: veli });
    const b = await db.query(`select 1 from spor_bildirimler where kullanici_id = $1 and tur = 'yeni_kayit'`, [yonetici]);
    expect(b.rows).toHaveLength(1);
  });

  it("antrenör deneme dersi planlar; veliye tarih ve yerle bildirim gider", async () => {
    await oturumla(db, antrenor, `select spor_deneme_dersi_planla($1, '2026-11-05 17:30+03', 'Sentetik saha', 'İlk görüşme')`, [aday]);
    const s = await db.query<{ yer: string; notu: string }>(`select deneme_yeri as yer, aday_notu as notu from spor_sporcular where id = $1`, [aday]);
    expect(s.rows[0]).toEqual({ yer: "Sentetik saha", notu: "İlk görüşme" });
    const b = await db.query<{ baslik: string; govde: string }>(
      `select baslik, govde from spor_bildirimler where kullanici_id = $1 and tur = 'deneme_dersi'`, [veli]);
    expect(b.rows[0].baslik).toBe("Deniz için deneme dersi: 05.11.2026 17:30");
    expect(b.rows[0].govde).toMatch(/^Yer: Sentetik saha\. /);
  });

  it("veli deneme dersi planlayamaz; aktif sporcuya deneme planlanmaz", async () => {
    expect(await hataMesaji(oturumla(db, veli, `select spor_deneme_dersi_planla($1, now())`, [aday]))).toMatch(/personeli/);
  });

  it("başvuruyu yalnızca yönetim kapatır; kayıt silinmez, neden saklanır", async () => {
    expect(await hataMesaji(oturumla(db, antrenor, `select spor_aday_kapat($1, 'x')`, [aday]))).toMatch(/yönetimi/);
    await oturumla(db, yonetici, `select spor_aday_kapat($1, 'Başka kulübü seçti')`, [aday]);
    const r = await db.query<{ durum: string; notu: string; kapanis: string | null }>(
      `select durum, aday_notu as notu, aday_kapanis::text as kapanis from spor_sporcular where id = $1`, [aday]);
    expect(r.rows[0].durum).toBe("pasif");
    expect(r.rows[0].notu).toBe("İlk görüşme · Başka kulübü seçti");
    expect(r.rows[0].kapanis).not.toBeNull();
    expect(await hataMesaji(oturumla(db, yonetici, `select spor_aday_kapat($1, 'x')`, [aday]))).toMatch(/sonuçlanmış/);
    expect(await hataMesaji(oturumla(db, antrenor, `select spor_deneme_dersi_planla($1, now())`, [aday]))).toMatch(/onay bekleyen/);
  });
});
