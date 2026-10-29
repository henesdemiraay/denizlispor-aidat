import Link from "next/link";
import { notFound } from "next/navigation";
import UstBaslik from "@/components/UstBaslik";
import YazdirDugmesi from "@/components/YazdirDugmesi";
import { oturum } from "@/lib/yetki";
import { DEGERLENDIRME_ALANLARI } from "@/lib/antrenman";
import { donemAdi, gunAdi } from "@/lib/format";
import { bugunkuSezon, sezonAdi, sezonIcinde, sezonYili } from "@/lib/sezon";
import type { Degerlendirme, Mac, Olcum, Sporcu, SporcuNotu } from "@/lib/types";
import { KULUP } from "@/kulup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sezon karnesi" };

type YoklamaSatir = { durum: string; spor_antrenmanlar: { tarih: string } | null };
type KatilimSatir = { dakika: number; ilk_onbir: boolean; gol: number; asist: number; spor_maclar: Mac | null };

function ort(dizi: (number | null | undefined)[]) {
  const d = dizi.filter((v): v is number => typeof v === "number");
  return d.length ? d.reduce((t, v) => t + v, 0) / d.length : null;
}

function sayi(v: number | null, ek = "") {
  return v === null ? "–" : `${v.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}${ek}`;
}

/** Yazdırılabilir sezon karnesi: devam, değerlendirme, ölçüm, maç ve antrenör notları — tek sayfa. */
export default async function SezonKarnesi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sezon?: string }>;
}) {
  const { id } = await params;
  const { sezon: sezonParam } = await searchParams;
  const { supabase } = await oturum();

  const { data: sporcuData } = await supabase.from("spor_sporcular").select("*").eq("id", id).maybeSingle();
  if (!sporcuData) notFound();
  const sporcu = sporcuData as Sporcu;

  const [{ data: yokData }, { data: degData }, { data: olcData }, { data: katData }, { data: notData }] =
    await Promise.all([
      supabase.from("spor_yoklama").select("durum, spor_antrenmanlar(tarih)").eq("sporcu_id", id),
      supabase.from("spor_degerlendirmeler").select("*").eq("sporcu_id", id).order("donem"),
      supabase.from("spor_olcumler").select("*").eq("sporcu_id", id).order("tarih"),
      supabase.from("spor_mac_katilim").select("dakika, ilk_onbir, gol, asist, spor_maclar(*)").eq("sporcu_id", id),
      supabase.from("spor_sporcu_notlari").select("*").eq("sporcu_id", id).eq("gorunurluk", "veli").order("tarih"),
    ]);

  const yoklamaTum = (yokData ?? []) as unknown as YoklamaSatir[];
  const degTum = (degData ?? []) as Degerlendirme[];
  const olcTum = (olcData ?? []) as Olcum[];
  const katTum = (katData ?? []) as unknown as KatilimSatir[];
  const notTum = (notData ?? []) as SporcuNotu[];

  // Verisi olan sezonlar (seçici için) + seçili sezon
  const sezonlar = new Set<number>([bugunkuSezon()]);
  for (const y of yoklamaTum) if (y.spor_antrenmanlar) sezonlar.add(sezonYili(y.spor_antrenmanlar.tarih));
  for (const d of degTum) sezonlar.add(sezonYili(d.donem));
  for (const k of katTum) if (k.spor_maclar) sezonlar.add(sezonYili(k.spor_maclar.tarih));
  const sezonListesi = [...sezonlar].sort((a, b) => b - a);
  const istenen = Number(sezonParam);
  const sezon = sezonListesi.includes(istenen) ? istenen : sezonListesi[0];

  const yoklama = yoklamaTum.filter((y) => sezonIcinde(y.spor_antrenmanlar?.tarih, sezon));
  const deg = degTum.filter((d) => sezonIcinde(d.donem, sezon));
  const olc = olcTum.filter((o) => sezonIcinde(o.tarih, sezon));
  const kat = katTum.filter((k) => sezonIcinde(k.spor_maclar?.tarih, sezon));
  const notlar = notTum.filter((n) => sezonIcinde(n.tarih, sezon));

  const sayac = (d: string) => yoklama.filter((y) => y.durum === d).length;
  const katildi = sayac("geldi") + sayac("gec");
  const devam = yoklama.length ? Math.round((katildi / yoklama.length) * 100) : null;

  const alanOrt = DEGERLENDIRME_ALANLARI.map((a) => ({
    ad: a.ad,
    deger: ort(deg.map((d) => d[a.anahtar as keyof Degerlendirme] as number | null)),
  }));
  const genelOrt = ort(alanOrt.map((a) => a.deger));

  const ilkOlc = olc[0];
  const sonOlc = olc[olc.length - 1];
  const olcumSatirlari: { ad: string; ilk: number | null; son: number | null; ek: string; azIyi?: boolean }[] = [
    { ad: "Boy", ilk: ilkOlc?.boy_cm ?? null, son: sonOlc?.boy_cm ?? null, ek: " cm" },
    { ad: "Kilo", ilk: ilkOlc?.kilo_kg ?? null, son: sonOlc?.kilo_kg ?? null, ek: " kg" },
    { ad: "20 m sprint", ilk: ilkOlc?.sprint_20m ?? null, son: sonOlc?.sprint_20m ?? null, ek: " sn", azIyi: true },
    { ad: "Dikey sıçrama", ilk: ilkOlc?.dikey_sicrama_cm ?? null, son: sonOlc?.dikey_sicrama_cm ?? null, ek: " cm" },
  ];

  const mac = {
    sayi: kat.length,
    ilk11: kat.filter((k) => k.ilk_onbir).length,
    dakika: kat.reduce((t, k) => t + (k.dakika ?? 0), 0),
    gol: kat.reduce((t, k) => t + (k.gol ?? 0), 0),
    asist: kat.reduce((t, k) => t + (k.asist ?? 0), 0),
  };

  const sonYorum = [...deg].reverse().find((d) => d.yorum)?.yorum ?? null;

  return (
    <>
      <div className="print:hidden">
        <UstBaslik baslik="Sezon karnesi" altBaslik={`${sporcu.ad} ${sporcu.soyad}`} geri={`/panel/sporcu/${sporcu.id}`}>
          {sezonListesi.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {sezonListesi.map((s) => (
                <Link
                  key={s}
                  href={`/panel/sporcu/${sporcu.id}/karne?sezon=${s}`}
                  className={`rozet shrink-0 px-3 py-2 text-xs ${s === sezon ? "bg-yesil-500 text-anametin" : "bg-white/10 text-white"}`}
                >
                  {sezonAdi(s)}
                </Link>
              ))}
            </div>
          ) : null}
        </UstBaslik>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 print:max-w-none print:p-0">
        <article className="karne-kagit overflow-hidden rounded-[22px] bg-[#FFFFFF] text-[#1A1718] print:rounded-none">
          <header className="flex items-center gap-4 border-b-4 px-6 py-5" style={{ borderColor: "var(--marka)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={KULUP.arma} alt={`${KULUP.kisaAd} arması`} className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[#5E5859]">
                {KULUP.ad.toLocaleUpperCase("tr-TR")} · SEZON KARNESİ
              </p>
              <h1 className="manset mt-1 text-3xl">
                {sporcu.ad} {sporcu.soyad}
              </h1>
              <p className="text-sm text-[#4A4546]">
                {[sezonAdi(sezon) + " sezonu", sporcu.yas_grubu, sporcu.mevki, sporcu.forma_no ? `#${sporcu.forma_no}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {genelOrt !== null ? (
              <div className="text-center">
                <p className="manset text-5xl" style={{ color: "var(--marka)" }}>{sayi(genelOrt)}</p>
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#5E5859]">ORTALAMA</p>
              </div>
            ) : null}
          </header>

          <section className="grid grid-cols-2 gap-px bg-[#E6E3E3] sm:grid-cols-4">
            {[
              { ad: "Devam", deger: devam === null ? "–" : `%${devam}` },
              { ad: "Antrenman", deger: `${katildi}/${yoklama.length}` },
              { ad: "Maç", deger: String(mac.sayi) },
              { ad: "Gol · Asist", deger: `${mac.gol} · ${mac.asist}` },
            ].map((k) => (
              <div key={k.ad} className="bg-[#FFFFFF] px-4 py-4">
                <p className="manset text-[28px]">{k.deger}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#5E5859]">{k.ad}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
            <section>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5E5859]">
                Antrenör değerlendirmesi
              </h2>
              {deg.length === 0 ? (
                <p className="mt-2 text-sm text-[#5E5859]">Bu sezon için değerlendirme girilmemiş.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {alanOrt.map((a) => (
                    <li key={a.ad}>
                      <div className="flex justify-between text-sm">
                        <span>{a.ad}</span>
                        <b>{sayi(a.deger)} / 10</b>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E6E3E3]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${((a.deger ?? 0) / 10) * 100}%`, background: "var(--marka)" }}
                        />
                      </div>
                    </li>
                  ))}
                  <li className="pt-1 text-xs text-[#5E5859]">
                    {deg.length} değerlendirme: {deg.map((d) => donemAdi(d.donem)).join(", ")}
                  </li>
                </ul>
              )}
            </section>

            <section>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5E5859]">
                Fiziksel gelişim
              </h2>
              {olc.length === 0 ? (
                <p className="mt-2 text-sm text-[#5E5859]">Bu sezon ölçüm yapılmamış.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#5E5859]">
                      <th className="pb-1 font-medium"></th>
                      <th className="pb-1 font-medium">İlk</th>
                      <th className="pb-1 font-medium">Son</th>
                      <th className="pb-1 font-medium">Fark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {olcumSatirlari.map((o) => {
                      const fark = o.ilk !== null && o.son !== null ? o.son - o.ilk : null;
                      const iyi = fark === null || fark === 0 ? null : o.azIyi ? fark < 0 : fark > 0;
                      return (
                        <tr key={o.ad} className="border-t border-[#EEECEC]">
                          <td className="py-1.5">{o.ad}</td>
                          <td>{sayi(o.ilk, o.ek)}</td>
                          <td>{sayi(o.son, o.ek)}</td>
                          <td style={{ color: iyi === null ? undefined : iyi ? "var(--marka)" : "#B4412F" }}>
                            {fark === null ? "–" : `${fark > 0 ? "+" : ""}${sayi(Number(fark.toFixed(2)))}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5E5859]">
                Devam ayrıntısı
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Geldi", sayac("geldi")],
                  ["Geç geldi", sayac("gec")],
                  ["İzinli", sayac("izinli")],
                  ["Gelmedi", sayac("gelmedi")],
                ].map(([ad, n]) => (
                  <li key={ad as string} className="flex justify-between rounded-lg bg-[#F4F3F3] px-3 py-2">
                    <span>{ad}</span>
                    <b>{n}</b>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5E5859]">
                Maçlar
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Kadroda", mac.sayi],
                  ["İlk 11", mac.ilk11],
                  ["Dakika", mac.dakika],
                  ["Gol + asist", mac.gol + mac.asist],
                ].map(([ad, n]) => (
                  <li key={ad as string} className="flex justify-between rounded-lg bg-[#F4F3F3] px-3 py-2">
                    <span>{ad}</span>
                    <b>{n}</b>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {sonYorum || notlar.length ? (
            <section className="border-t border-[#EEECEC] px-6 py-5">
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5E5859]">
                Antrenörün sözü
              </h2>
              {sonYorum ? <p className="mt-2 text-[15px] leading-relaxed">“{sonYorum}”</p> : null}
              {notlar.slice(-3).map((n) => (
                <p key={n.id} className="mt-2 text-sm leading-relaxed text-[#4A4546]">
                  <span className="font-mono text-[11px] text-[#5E5859]">{gunAdi(n.tarih)} · </span>
                  {n.icerik}
                </p>
              ))}
            </section>
          ) : null}

          <footer className="flex items-center justify-between border-t border-[#EEECEC] px-6 py-4 font-mono text-[10px] tracking-[0.06em] text-[#857E7F]">
            <span>{KULUP.resmiAd.toLocaleUpperCase("tr-TR")}</span>
            <span>DÜZENLENME {gunAdi(new Date().toISOString())}</span>
          </footer>
        </article>

        <div className="mt-4">
          <YazdirDugmesi etiket="Yazdır / PDF olarak kaydet" />
        </div>
      </div>
    </>
  );
}
