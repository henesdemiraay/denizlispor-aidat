import { describe, expect, it } from "vitest";
import { kalanTutar, kismiMi, odenenler } from "@/lib/aidat";

describe("kısmi ödeme", () => {
  const odemeler = [
    { aidat_id: "a", tutar: "400", durum: "onaylandi" },
    { aidat_id: "a", tutar: 100, durum: "beklemede" },
    { aidat_id: "b", tutar: 1000, durum: "onaylandi" },
    { aidat_id: null, tutar: 50, durum: "onaylandi" },
  ];
  const o = odenenler(odemeler);

  it("yalnızca onaylı ödemeler sayılır", () => {
    expect(o.get("a")).toBe(400);
    expect(o.get("b")).toBe(1000);
  });

  it("kalan ve kısmi", () => {
    const a = { id: "a", tutar: "1000", durum: "bekliyor" };
    expect(kalanTutar(a, o)).toBe(600);
    expect(kismiMi(a, o)).toBe(true);
    expect(kalanTutar({ id: "b", tutar: 1000, durum: "odendi" }, o)).toBe(0);
    expect(kalanTutar({ id: "c", tutar: 750, durum: "bekliyor" }, o)).toBe(750);
    expect(kismiMi({ id: "c", tutar: 750, durum: "bekliyor" }, o)).toBe(false);
    expect(kalanTutar({ id: "m", tutar: 0, durum: "muaf" }, o)).toBe(0);
  });
});
