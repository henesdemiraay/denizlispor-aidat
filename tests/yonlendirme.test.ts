import { describe, expect, it } from "vitest";
import { guvenliYol } from "@/lib/yonlendirme";

describe("güvenli yönlendirme", () => {
  it("uygulama içi yolları geçirir", () => {
    expect(guvenliYol("/panel/sporcu-ekle")).toBe("/panel/sporcu-ekle");
    expect(guvenliYol("/panel?x=1")).toBe("/panel?x=1");
  });
  it("başka siteye götüren biçimleri reddeder", () => {
    for (const k of ["//kotu.com", "/\\kotu.com", "https://kotu.com", "javascript:alert(1)", "kotu", "/\nx", null, ""]) {
      expect(guvenliYol(k as string | null)).toBe("/git");
    }
  });
});
