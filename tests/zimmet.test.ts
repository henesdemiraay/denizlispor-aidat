import { describe, expect, it } from "vitest";
import { zimmetDurumu, zimmetSirala } from "@/lib/zimmet";

const b = "2026-11-10";
describe("zimmet durumu", () => {
  it("iade, gecikme, yaklaşma ve süresiz", () => {
    expect(zimmetDurumu({ iade_beklenen: "2026-11-01", iade_edildi: "2026-11-05" }, b)).toBe("iade");
    expect(zimmetDurumu({ iade_beklenen: "2026-11-09", iade_edildi: null }, b)).toBe("gecikti");
    expect(zimmetDurumu({ iade_beklenen: "2026-11-10", iade_edildi: null }, b)).toBe("yaklasiyor");
    expect(zimmetDurumu({ iade_beklenen: "2026-11-17", iade_edildi: null }, b)).toBe("yaklasiyor");
    expect(zimmetDurumu({ iade_beklenen: "2026-11-18", iade_edildi: null }, b)).toBe("sende");
    expect(zimmetDurumu({ iade_beklenen: null, iade_edildi: null }, b)).toBe("sende");
  });
  it("gecikenler başa, iade alınanlar sona", () => {
    const l = [
      { id: "a", verilis: "2026-09-01", iade_beklenen: null, iade_edildi: "2026-10-01" },
      { id: "b", verilis: "2026-09-01", iade_beklenen: null, iade_edildi: null },
      { id: "c", verilis: "2026-09-01", iade_beklenen: "2026-11-01", iade_edildi: null },
      { id: "d", verilis: "2026-09-01", iade_beklenen: "2026-11-12", iade_edildi: null },
    ];
    expect(zimmetSirala(l, b).map((z) => z.id)).toEqual(["c", "d", "b", "a"]);
  });
});
