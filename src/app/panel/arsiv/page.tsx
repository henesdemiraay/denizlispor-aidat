import Link from "next/link";
import UstBaslik from "@/components/UstBaslik";
import { oturum } from "@/lib/yetki";
import { gunAdi } from "@/lib/format";
import { MAC_TURU, macBasligi, skorMetni } from "@/lib/mac";
import type { Mac } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Sezon Eylül'de başlar: "2026-03-14" → 2025 */
function sezonYili(tarih: string) {
  const d = new Date(tarih + "T00:00:00");
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
}
const sezonAdi = (y: number) => `${y}–${String(y + 1).slice(2)}`;

export default async function Arsiv({ searchParams }: { searchParams: Promise<{ sezon?: string }> }) {
  const { supabase } = await oturum();
  const { sezon: secim } = await searchParams;

  const [{ data: macData }, { data: antData }] = await Promise.all([
    supabase.from("spor_maclar").select("*").order("tarih", { ascending: false }).limit(1000),
    supabase.from("spor_antrenmanlar").select("tarih, yas_grubu").limit(5000),
  ]);
  const maclar = (macData ?? []) as Mac[];
  const antrenmanlar = (antData ?? []) as { tarih: string; yas_grubu: string | null }[];

  const bugunTR = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const buSezon = sezonYili(bugunTR);

  const yillar = new Set<number>([buSezon]);
  for (const m of maclar) yillar.add(sezonYili(m.tarih));
  for (const a of antrenmanlar) yillar.add(sezonYili(a.tarih));
  const sezonlar = [...yillar].sort((a, b) => b - a);

  const secili = secim && sezonlar.includes(Number(secim)) ? Number(secim) : buSezon;
  const suruyor = secili === buSezon;

  const sezonMaclari = maclar.filter((m) => sezonYili(m.tarih) === secili);
  const sonuclu = sezonMaclari.filter((m) => m.skor_biz !== null && m.skor_rakip !== null);
  const galibiyet = sonuclu.filter((m) => m.skor_biz! > m.skor_rakip!).length;
  const beraberlik = sonuclu.filter((m) => m.skor_biz === m.skor_rakip).length;
  const maglubiyet = sonuclu.length - galibiyet - beraberlik;
  const golAtilan = sonuclu.reduce((t, m) => t + (m.skor_biz ?? 0), 0);
  const sezonAntrenman = antrenmanlar.filter((a) => sezonYili(a.tarih) === secili).length;
  const gruplar = new Set(
    [...sezonMaclari.map((m) => m.yas_grubu), ...antrenmanlar.filter((a) => sezonYili(a.tarih) === secili).map((a) => a.yas_grubu)].filter(Boolean),
  );

  // Vitrin: sezonun en farklı galibiyeti; yoksa en son maç
  const vitrin =
    [...sonuclu]
      .filter((m) => m.skor_biz! > m.skor_rakip!)
      .sort((a, b) => b.skor_biz! - b.skor_rakip! - (a.skor_biz! - a.skor_rakip!))[0] ?? sezonMaclari[0];

  return (
    <>
      <UstBaslik baslik="Altyapı arşivi" altBaslik="Kulübün yaşayan hafızası" />

      <div className="mx-auto w-full max-w-3xl px-4 pb-28">
        <nav aria-label="Sezonlar" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {sezonlar.map((y) => {
            const aktif = y === secili;
            return (
              <Link
                key={y}
                href={`/panel/arsiv?sezon=${y}`}
                aria-current={aktif ? "page" : undefined}
                className={`flex h-10 shrink-0 items-center rounded-full px-4 text-[13px] ${
                  aktif
                    ? "bg-yesil-500 font-extrabold text-siyah"
                    : "bg-yuzey font-semibold text-white ring-1 ring-white/10"
                }`}
              >
                {sezonAdi(y)}
              </Link>
            );
          })}
        </nav>

        <article className="mt-4 overflow-hidden rounded-[22px] bg-[#FFFFFF] text-siyah">
          <div className="relative bg-[#E6E3E3] px-5 pb-5 pt-12">
            <span className="absolute left-4 top-4 flex h-6 items-center rounded-full bg-siyah px-2.5 text-[11px] font-bold text-[#FFFFFF]">
              {suruyor ? "SÜRÜYOR" : "MÜHÜRLENDİ"}
            </span>
            <p className="font-mono text-[11px] tracking-[0.06em] text-[#5E5859]">
              VİTRİN · {sezonAdi(secili)}
            </p>
            {vitrin ? (
              <>
                <h2 className="manset mt-1.5 text-[30px] leading-[0.92]">{macBasligi(vitrin)}</h2>
                <p className="mt-2 text-[15px] text-[#4A4546]">
                  {[skorMetni(vitrin), gunAdi(vitrin.tarih), MAC_TURU[vitrin.tur] ?? vitrin.tur, vitrin.yas_grubu]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </>
            ) : (
              <h2 className="manset mt-1.5 text-[30px] leading-[0.92]">
                {suruyor ? "Sezon yazılıyor" : "Bu sezonun kaydı yok"}
              </h2>
            )}
          </div>
          <p className="px-5 py-4 text-sm leading-relaxed text-[#4A4546]">
            {suruyor
              ? "Her antrenman, maç ve gol bu rafa işleniyor. Sezon Eylül'de kapanınca maçlar, kadrolar ve kartlar kalıcı olarak arşivde kalır."
              : "Bu sezon mühürlendi. Maçlar, antrenmanlar ve sezon kartları kulüp arşivinde saklanıyor."}
          </p>
        </article>

        <section className="mt-3 grid grid-cols-3 gap-2.5">
          {[
            ["maç", sezonMaclari.length],
            ["antrenman", sezonAntrenman],
            ["yaş grubu", gruplar.size],
          ].map(([ad, deger]) => (
            <div key={String(ad)} className="kart px-3 py-3">
              <p className="font-manset text-[28px] font-extrabold leading-none text-white">{String(deger)}</p>
              <p className="mt-1 text-[11px] text-neutral-500">{String(ad)}</p>
            </div>
          ))}
        </section>

        {sonuclu.length > 0 ? (
          <section className="kart mt-2.5 grid grid-cols-4 px-1 py-3 text-center">
            {[
              ["G", galibiyet],
              ["B", beraberlik],
              ["M", maglubiyet],
              ["gol", golAtilan],
            ].map(([ad, deger]) => (
              <div key={String(ad)}>
                <p className={`font-manset text-[24px] font-extrabold leading-none ${ad === "G" ? "text-yesil-500" : "text-white"}`}>
                  {String(deger)}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">{String(ad)}</p>
              </div>
            ))}
          </section>
        ) : null}

        {sezonMaclari.length > 0 ? (
          <>
            <h2 className="mb-2 mt-7 px-1 bolum-basligi">Sezonun maçları</h2>
            <div className="kart divide-y divide-white/[0.06]">
              {sezonMaclari.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{macBasligi(m)}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {gunAdi(m.tarih)} · {MAC_TURU[m.tur] ?? m.tur}
                      {m.yas_grubu ? ` · ${m.yas_grubu}` : ""}
                    </p>
                  </div>
                  <span className="font-manset text-xl font-extrabold text-white">{skorMetni(m) ?? "–"}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
