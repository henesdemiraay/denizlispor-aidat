import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  oncekiYol,
  ustEkranaDon,
  yerDegistirAl,
  yerDegistirIsaretle,
  yiginOku,
  yiginYaz,
} from "@/lib/gezinme";

function bellekDeposu() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { sessionStorage: bellekDeposu() });
});

describe("gezinme yığını", () => {
  it("boş başlar, yazılanı okur, en fazla 50 ekran tutar", () => {
    expect(yiginOku()).toEqual([]);
    yiginYaz(Array.from({ length: 60 }, (_, i) => `/e${i}`));
    const y = yiginOku();
    expect(y).toHaveLength(50);
    expect(y[0]).toBe("/e10");
    expect(y[49]).toBe("/e59");
  });

  it("yer değiştirme işareti bir kez okunur", () => {
    expect(yerDegistirAl()).toBe(false);
    yerDegistirIsaretle();
    expect(yerDegistirAl()).toBe(true);
    expect(yerDegistirAl()).toBe(false);
  });

  it("önceki yol", () => {
    yiginYaz(["/panel"]);
    expect(oncekiYol()).toBeNull();
    yiginYaz(["/panel", "/panel/sporcu/1"]);
    expect(oncekiYol()).toBe("/panel");
  });

  it("‹ düğmesi: üst ekran hemen öncedeyse geri gider", () => {
    yiginYaz(["/panel", "/panel/sporcu/1"]);
    const router = { back: vi.fn(), replace: vi.fn() };
    ustEkranaDon(router, "/panel");
    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("‹ düğmesi: üst ekran geçmişte değilse yerine açar (sorgu dizesi yok sayılır)", () => {
    yiginYaz(["/panel/antrenman", "/panel/sporcu/1"]);
    const router = { back: vi.fn(), replace: vi.fn() };
    ustEkranaDon(router, "/panel?sekme=2");
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/panel?sekme=2");
    expect(yerDegistirAl()).toBe(true);
  });

  it("sessionStorage kullanılamazsa (gizli sekme) çökmez", () => {
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: () => {
          throw new Error("yasak");
        },
        setItem: () => {
          throw new Error("yasak");
        },
        removeItem: () => {
          throw new Error("yasak");
        },
      },
    });
    expect(yiginOku()).toEqual([]);
    expect(() => yiginYaz(["/a"])).not.toThrow();
    expect(yerDegistirAl()).toBe(false);
  });
});
