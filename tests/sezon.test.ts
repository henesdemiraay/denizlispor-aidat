import { describe, expect, it } from "vitest";
import { sezonAdi, sezonAraligi, sezonBittiMi, sezonIcinde, sezonYili } from "@/lib/sezon";

describe("sezon", () => {
  it("Eylül'de başlar, Ağustos'ta biter", () => {
    expect(sezonYili("2025-08-31")).toBe(2024);
    expect(sezonYili("2025-09-01")).toBe(2025);
    expect(sezonYili("2026-01-15T10:00:00Z")).toBe(2025);
  });

  it("ad ve aralık", () => {
    expect(sezonAdi(2025)).toBe("2025–26");
    expect(sezonAdi(2099)).toBe("2099–00");
    expect(sezonAraligi(2025)).toEqual({ bas: "2025-09-01", bit: "2026-08-31" });
  });

  it("sezon içinde mi", () => {
    expect(sezonIcinde("2026-08-31", 2025)).toBe(true);
    expect(sezonIcinde("2026-09-01", 2025)).toBe(false);
    expect(sezonIcinde(null, 2025)).toBe(false);
  });

  it("sezon bitti mi (mühürlenebilir mi) — veritabanı kuralıyla aynı", () => {
    expect(sezonBittiMi(2025, "2026-08-31")).toBe(false);
    expect(sezonBittiMi(2025, "2026-09-01")).toBe(true);
    expect(sezonBittiMi(2026, "2026-10-29")).toBe(false);
  });
});
