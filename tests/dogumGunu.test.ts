import { describe, expect, it } from "vitest";
import { kalanGunMetni, yaklasanDogumGunleri } from "@/lib/dogumGunu";

const s = (id: string, dogum_tarihi: string | null) => ({ id, dogum_tarihi });

describe("yaklaşan doğum günleri", () => {
  it("bugünden itibaren 7 gün içindekileri sıralı ve yaşıyla verir", () => {
    const r = yaklasanDogumGunleri(
      [s("a", "2014-11-02"), s("b", "2013-10-29"), s("c", "2012-11-05"), s("d", null), s("e", "2015-10-28")],
      "2026-10-29",
    );
    expect(r.map((x) => [x.sporcu.id, x.kalan, x.yas])).toEqual([
      ["b", 0, 13],
      ["a", 4, 12],
    ]);
  });

  it("yıl dönümünü aşar", () => {
    const r = yaklasanDogumGunleri([s("a", "2014-01-02")], "2026-12-29");
    expect(r[0]).toMatchObject({ kalan: 4, yas: 13 });
  });

  it("29 Şubat doğumlu artık olmayan yılda 28 Şubat'ta", () => {
    const r = yaklasanDogumGunleri([s("a", "2016-02-29")], "2027-02-28", 1);
    expect(r[0]).toMatchObject({ kalan: 0, yas: 11 });
  });

  it("metin", () => {
    expect([0, 1, 3].map(kalanGunMetni)).toEqual(["Bugün", "Yarın", "3 gün sonra"]);
  });
});
