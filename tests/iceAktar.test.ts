import { describe, expect, it } from "vitest";
import { basligiEsle, satirlariHazirla, tabloAyristir, tarihCevir, tutarCevir } from "@/lib/iceAktar";

describe("başlık eşleme", () => {
  it("Türkçe ve kısaltılmış başlıkları tanır", () => {
    expect(
      ["Adı", "SOYADI", "Doğum Tarihi", "Yaş Grubu", "Veli Adı Soyadı", "Veli Tel", "E-Posta", "Aidat (₺)", "Okulu", "Forma No", "Not", "Bilinmeyen"].map(basligiEsle),
    ).toEqual(["ad", "soyad", "dogum_tarihi", "yas_grubu", "veli_ad_soyad", "veli_telefon", "veli_eposta", "aylik_aidat", "okul", "forma_no", "notlar", null]);
    expect(basligiEsle("Ad Soyad")).toBe("ad_soyad");
    expect(basligiEsle("Veli")).toBe("veli_ad_soyad");
  });
});

describe("ayrıştırma", () => {
  it("Excel'den yapıştırılan sekme ayrımlı metin", () => {
    expect(tabloAyristir("Ad\tSoyad\r\nAli\tYılmaz\r\n\r\n")).toEqual([["Ad", "Soyad"], ["Ali", "Yılmaz"]]);
  });
  it("noktalı virgüllü CSV, BOM ve tırnaklı hücre", () => {
    expect(tabloAyristir('﻿Ad;Not\n"Ayşe";"Sol ayak; hızlı ""kanat"""')).toEqual([["Ad", "Not"], ["Ayşe", 'Sol ayak; hızlı "kanat"']]);
  });
  it("virgüllü CSV", () => {
    expect(tabloAyristir("ad,soyad\nCan,Er")).toEqual([["ad", "soyad"], ["Can", "Er"]]);
  });
});

describe("dönüşümler", () => {
  it("tarihler", () => {
    expect(["05.03.2014", "5/3/2014", "2014-03-05", "5.3.14"].map(tarihCevir)).toEqual(["2014-03-05", "2014-03-05", "2014-03-05", "2014-03-05"]);
    expect(["31.02.2014", "abc", "01.01.1850"].map(tarihCevir)).toEqual([null, null, null]);
  });
  it("tutarlar", () => {
    expect(["1.500,00 ₺", "1500", "1,500.50", "750 TL", ""].map(tutarCevir)).toEqual([1500, 1500, 1500.5, 750, null]);
  });
});

describe("satırları hazırlama", () => {
  it("ad soyad tek sütunda olabilir; hatalı satırlar ayrı listelenir", () => {
    const t = tabloAyristir(
      "Ad Soyad\tDoğum Tarihi\tAidat\tVeli E-posta\n" +
        "Mehmet Ali Kaya\t12.04.2015\t1.250,00\tVELI@ornek.com\n" +
        "Zeynep\t2015-13-01\tabc\tyanlış",
    );
    const { satirlar } = satirlariHazirla(t);
    expect(satirlar[0].kayit).toMatchObject({ ad: "Mehmet Ali", soyad: "Kaya", dogum_tarihi: "2015-04-12", aylik_aidat: 1250, veli_eposta: "veli@ornek.com" });
    expect(satirlar[1].kayit).toBeNull();
    expect(satirlar[1].satirNo).toBe(3);
    expect(satirlar[1].hatalar).toEqual(["Soyad yok", "Doğum tarihi okunamadı: 2015-13-01", "Aidat okunamadı: abc", "E-posta geçersiz: yanlış"]);
  });
});
