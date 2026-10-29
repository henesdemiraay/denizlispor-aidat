import Link from "next/link";
import FotoYukle from "@/components/FotoYukle";
import { AYLAR } from "@/lib/format";
import type { Sporcu } from "@/lib/types";

export type YolculukAdimi = {
  tarih: string;
  baslik: string;
  ayrinti?: string;
  vurgu?: boolean;
};

/** Sezon sayısı: sezon Eylül'de başlar. */
export function sezonSayisi(kayitTarihi: string, bugun = new Date()) {
  const k = new Date(kayitTarihi + "T00:00:00");
  const sezon = (d: Date) => (d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1);
  return Math.max(1, sezon(bugun) - sezon(k) + 1);
}

function kisaTarih(t: string) {
  const d = new Date(t.length > 10 ? t : t + "T00:00:00");
  return `${d.getDate()} ${AYLAR[d.getMonth()].toLocaleUpperCase("tr-TR")} ${d.getFullYear()}`;
}

export default function Pasaport({
  sporcu,
  fotoUrl,
  sayilar,
  yolculuk,
}: {
  sporcu: Sporcu;
  fotoUrl: string | null;
  sayilar: { antrenman: number; mac: number; dakika: number; gol: number };
  yolculuk: YolculukAdimi[];
}) {
  const no = `${sporcu.kayit_tarihi.slice(0, 4)}-${sporcu.id.slice(0, 4).toUpperCase()}`;
  const alt = [sporcu.mevki, sporcu.ayak ? `${sporcu.ayak} ayak` : null, sporcu.dogum_tarihi?.slice(0, 4)]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="mt-5 flex items-center justify-between px-1 font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
        <span>Sporcu pasaportu</span>
        <span>No {no}</span>
      </div>

      <section className="relative mt-2 flex gap-4 overflow-hidden rounded-[22px] bg-[#FFFFFF] p-[18px] text-siyah">
        <div className="shrink-0">
          <FotoYukle
            sporcuId={sporcu.id}
            basHarfler={`${sporcu.ad[0]}${sporcu.soyad[0]}`}
            fotoUrl={fotoUrl}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="manset text-[38px] leading-[0.88] text-siyah">
            {sporcu.ad}
            <br />
            {sporcu.soyad}
          </h2>
          {alt ? <p className="text-[13px] text-[#4A4546]">{alt}</p> : null}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {sporcu.yas_grubu ? (
              <span className="flex h-6 items-center rounded-full bg-yesil-500 px-2.5 text-[11px] font-bold text-anametin">
                {sporcu.yas_grubu}
              </span>
            ) : null}
            <span className="flex h-6 items-center rounded-full border border-[#BDB7B8] px-2.5 font-mono text-[11px] text-siyah">
              {sezonSayisi(sporcu.kayit_tarihi)}. SEZON
            </span>
            {sporcu.forma_no ? (
              <span className="flex h-6 items-center rounded-full border border-[#BDB7B8] px-2.5 font-mono text-[11px] text-siyah">
                #{sporcu.forma_no}
              </span>
            ) : null}
          </div>
        </div>
        <svg
          aria-hidden
          viewBox="0 0 120 120"
          className="pointer-events-none absolute -bottom-9 -right-7 h-[120px] w-[120px] opacity-[0.14]"
        >
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--marka)" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="60" cy="60" r="38" fill="none" stroke="var(--marka)" strokeWidth="2" />
        </svg>
      </section>

      <section className="mt-3 grid grid-cols-4 overflow-hidden rounded-[18px] bg-yuzey ring-1 ring-white/[0.06]">
        {[
          ["antrenman", sayilar.antrenman, false],
          ["maç", sayilar.mac, false],
          ["dakika", sayilar.dakika.toLocaleString("tr-TR"), false],
          ["gol", sayilar.gol, true],
        ].map(([ad, deger, vurgu], i) => (
          <div key={String(ad)} className={`px-2.5 py-3 ${i < 3 ? "border-r border-white/[0.06]" : ""}`}>
            <p className={`font-manset text-[26px] font-extrabold leading-none ${vurgu ? "text-yesil-500" : "text-white"}`}>
              {String(deger)}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500">{String(ad)}</p>
          </div>
        ))}
      </section>

      {yolculuk.length > 0 ? (
        <>
          <div className="mb-3 mt-6 flex items-baseline justify-between px-1">
            <h2 className="manset text-[22px] text-white">Yolculuk</h2>
            <span className="text-xs text-neutral-500">ilk günden bugüne</span>
          </div>
          <ol className="px-1">
            {yolculuk.map((a, i) => {
              const son = i === yolculuk.length - 1;
              return (
                <li key={`${a.tarih}-${a.baslik}`} className="flex gap-3.5">
                  <div className="flex w-3.5 flex-col items-center">
                    <span
                      className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${
                        a.vurgu
                          ? "bg-[#FFFFFF] shadow-[0_0_0_4px_var(--marka)]"
                          : son
                            ? "border-2 border-yesil-500"
                            : "bg-yesil-500"
                      }`}
                    />
                    {!son ? <span className="mt-1 w-0.5 flex-1 bg-neutral-200" /> : null}
                  </div>
                  <div className={`flex flex-1 flex-col gap-0.5 ${son ? "" : "pb-4"}`}>
                    <span
                      className={`font-mono text-[11px] tracking-[0.04em] ${a.vurgu ? "text-yesil-500" : "text-neutral-500"}`}
                    >
                      {kisaTarih(a.tarih)}
                    </span>
                    <span className="text-[15px] font-bold text-white">{a.baslik}</span>
                    {a.ayrinti ? <span className="text-xs text-neutral-500">{a.ayrinti}</span> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      <Link href={`/panel/sporcu/${sporcu.id}/kart`} className="btn-birincil mt-5 w-full">
        Sezon kartını aç
      </Link>
      <Link href={`/panel/sporcu/${sporcu.id}/karne`} className="btn-ikincil mt-2 w-full">
        Sezon karnesi (yazdırılabilir)
      </Link>
    </>
  );
}
