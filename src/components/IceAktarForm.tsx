"use client";

import { useMemo, useState, useTransition } from "react";
import { ALAN_ADI, satirlariHazirla, tabloAyristir } from "@/lib/iceAktar";
import { sporcularIceAktar } from "@/app/yonetim/actions";

const SABLON =
  "﻿Ad;Soyad;Doğum tarihi;Yaş grubu;Mevki;Forma no;Okul;Veli ad soyad;Veli telefonu;Veli e-postası;Aylık aidat;Not\r\n" +
  "Deniz;Kaya;12.04.2015;U12;Orta saha;8;Atatürk İlkokulu;Ayşe Kaya;0555 000 00 00;ayse@ornek.com;1500;\r\n";

/** Dosyayı önce UTF-8, Türkçe karakterler bozuksa Windows-1254 (Excel "CSV") olarak okur. */
async function dosyaOku(f: File) {
  const tampon = await f.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(tampon);
  if (!utf8.includes("�")) return utf8;
  try {
    return new TextDecoder("windows-1254").decode(tampon);
  } catch {
    return utf8;
  }
}

export default function IceAktarForm() {
  const [metin, setMetin] = useState("");
  const [durum, setDurum] = useState<"aktif" | "pasif">("aktif");
  const [bekle, baslat] = useTransition();
  const [sonuc, setSonuc] = useState<string | null>(null);

  const { eslesme, satirlar } = useMemo(() => satirlariHazirla(tabloAyristir(metin)), [metin]);
  const gecerli = satirlar.filter((s) => s.kayit);
  const hatali = satirlar.filter((s) => !s.kayit);
  const tanınan = eslesme.filter(Boolean) as string[];

  function gonder() {
    setSonuc(null);
    baslat(async () => {
      const r = await sporcularIceAktar(JSON.stringify(gecerli.map((s) => s.kayit)), durum);
      setSonuc(r);
      if (r.startsWith("✓")) setMetin("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="kart space-y-3 px-4 py-4">
        <p className="text-sm font-bold text-neutral-900">1 · Listeyi getirin</p>
        <p className="text-xs leading-relaxed text-neutral-500">
          Excel&apos;de başlık satırı dahil hücreleri seçip kopyalayın ve aşağıya yapıştırın ya da CSV
          dosyası seçin. Sütun sırası önemli değil; başlıklar tanınır.
        </p>
        <textarea
          aria-label="Excel'den yapıştırın"
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          rows={6}
          className="alan font-mono text-xs"
          placeholder={"Ad\tSoyad\tDoğum tarihi\tVeli telefonu\nDeniz\tKaya\t12.04.2015\t0555…"}
        />
        <div className="flex flex-wrap gap-2">
          <label className="btn-ikincil cursor-pointer">
            CSV dosyası seç
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setMetin(await dosyaOku(f));
                e.target.value = "";
              }}
            />
          </label>
          <a
            className="btn-ikincil"
            download="sporcu-listesi-sablon.csv"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(SABLON)}`}
          >
            Örnek şablonu indir
          </a>
        </div>
      </div>

      {satirlar.length ? (
        <div className="kart space-y-3 px-4 py-4">
          <p className="text-sm font-bold text-neutral-900">2 · Kontrol edin</p>
          <p className="text-xs text-neutral-500">
            Tanınan sütunlar:{" "}
            {tanınan.length ? tanınan.map((a) => ALAN_ADI[a as keyof typeof ALAN_ADI]).join(", ") : "yok — başlık satırını da kopyalayın"}
          </p>
          <div className="flex gap-2 text-xs font-semibold">
            <span className="rozet bg-emerald-100 text-emerald-800">{gecerli.length} kayıt hazır</span>
            {hatali.length ? <span className="rozet bg-red-100 text-red-800">{hatali.length} satır hatalı</span> : null}
          </div>

          {hatali.length ? (
            <ul className="space-y-1 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
              {hatali.slice(0, 20).map((s) => (
                <li key={s.satirNo}>
                  Satır {s.satirNo}: {s.hatalar.join(" · ")}
                </li>
              ))}
              {hatali.length > 20 ? <li>… ve {hatali.length - 20} satır daha</li> : null}
            </ul>
          ) : null}

          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="text-neutral-500">
                <tr>
                  {["Ad soyad", "Doğum", "Grup", "Veli", "Telefon", "Aidat"].map((b) => (
                    <th key={b} className="py-1.5 pr-3 font-semibold">{b}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-neutral-800">
                {gecerli.slice(0, 30).map((s) => (
                  <tr key={s.satirNo}>
                    <td className="py-1.5 pr-3 font-semibold">{s.kayit!.ad} {s.kayit!.soyad}</td>
                    <td className="py-1.5 pr-3">{s.kayit!.dogum_tarihi ?? "—"}</td>
                    <td className="py-1.5 pr-3">{s.kayit!.yas_grubu ?? "—"}</td>
                    <td className="py-1.5 pr-3">{s.kayit!.veli_ad_soyad ?? "—"}</td>
                    <td className="py-1.5 pr-3">{s.kayit!.veli_telefon ?? "—"}</td>
                    <td className="py-1.5 pr-3">{s.kayit!.aylik_aidat || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gecerli.length > 30 ? <p className="mt-1 text-[11px] text-neutral-500">İlk 30 satır gösteriliyor.</p> : null}
          </div>
        </div>
      ) : null}

      {gecerli.length ? (
        <div className="kart space-y-3 px-4 py-4">
          <p className="text-sm font-bold text-neutral-900">3 · Aktarın</p>
          <div>
            <label className="etiket" htmlFor="ice-durum">Kayıtlar hangi durumda açılsın?</label>
            <select id="ice-durum" className="alan" value={durum} onChange={(e) => setDurum(e.target.value as "aktif" | "pasif")}>
              <option value="aktif">Aktif (aidatı olanlara bu ayın borcu açılır)</option>
              <option value="pasif">Pasif (önce kontrol edeceğim)</option>
            </select>
          </div>
          <p className="text-xs leading-relaxed text-neutral-500">
            Aynı ad, soyad ve doğum tarihiyle zaten kayıtlı olan sporcular atlanır. Veli aynı
            e-postayla hesap açınca çocuğu hesabına kendiliğinden bağlanır.
          </p>
          <button type="button" onClick={gonder} disabled={bekle} className="btn-birincil w-full">
            {bekle ? "Aktarılıyor…" : `${gecerli.length} sporcuyu aktar`}
          </button>
        </div>
      ) : null}

      {sonuc ? (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${sonuc.startsWith("✓") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
          {sonuc}
        </p>
      ) : null}
    </div>
  );
}
