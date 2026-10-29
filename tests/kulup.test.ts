import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const kok = join(__dirname, "..");
const klasor = join(kok, "src/kulup/kulupler");
const dosyalar = readdirSync(klasor).filter((d) => d.endsWith(".json"));

/** JWT biçimli anahtarın rolünü okur; yeni biçim (sb_publishable_) ise "publishable" döner. */
function anahtarRolu(anahtar: string) {
  if (anahtar.startsWith("sb_publishable_")) return "publishable";
  if (anahtar.startsWith("sb_secret_")) return "secret";
  const govde = anahtar.split(".")[1];
  if (!govde) return "bilinmiyor";
  return JSON.parse(Buffer.from(govde, "base64url").toString("utf8")).role as string;
}

describe.each(dosyalar)("kulüp yapılandırması: %s", (dosya) => {
  const k = JSON.parse(readFileSync(join(klasor, dosya), "utf8"));

  it("zorunlu alanlar dolu ve kod dosya adıyla aynı", () => {
    expect(k.kod).toBe(dosya.replace(".json", ""));
    for (const alan of ["ad", "kisaAd", "resmiAd", "sehir", "etiket", "arma"]) {
      expect(typeof k[alan], alan).toBe("string");
      expect(k[alan].length, alan).toBeGreaterThan(0);
    }
    for (const r of ["ana", "koyu", "acik", "anaUzerindeMetin"]) {
      expect(k.renkler[r], r).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
    expect(k.yayin.adres).toMatch(/^https:\/\//);
  });

  it("arma dosyası mevcut", () => {
    expect(existsSync(join(kok, "public", k.arma))).toBe(true);
  });

  it("veritabanı anahtarı gizli (service_role) anahtar değil", () => {
    // Boş anahtar: kurulumu yapılmamış örnek/şablon kulüp
    if (!k.supabase.yayinAnahtari) return;
    const rol = anahtarRolu(k.supabase.yayinAnahtari);
    expect(["anon", "publishable"]).toContain(rol);
  });
});
