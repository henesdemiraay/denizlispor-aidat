import Link from "next/link";
import UstBaslik from "@/components/UstBaslik";
import { yoneticiGerekli } from "@/lib/yetki";
import { arsivGetir, ozetVarMi, SEZON_DURUM_ADI, sezonDurumu, type SezonDurumu } from "@/lib/arsiv";
import { bugunkuSezon, sezonAdi, sezonYili } from "@/lib/sezon";

export const dynamic = "force-dynamic";

const ROZET: Record<SezonDurumu, string> = {
  suruyor: "bg-yesil-500 text-anametin",
  kapanis_bekliyor: "bg-amber-100 text-amber-900",
  muhurlu: "bg-neutral-200 text-neutral-800",
};

export default async function Sezonlar() {
  const { supabase } = await yoneticiGerekli();

  const [arsiv, { data: macData }, { data: antData }] = await Promise.all([
    arsivGetir(supabase),
    supabase.from("spor_maclar").select("tarih").limit(5000),
    supabase.from("spor_antrenmanlar").select("tarih").limit(10000),
  ]);

  const macSayisi = new Map<number, number>();
  const antSayisi = new Map<number, number>();
  for (const m of macData ?? []) {
    const y = sezonYili(m.tarih);
    macSayisi.set(y, (macSayisi.get(y) ?? 0) + 1);
  }
  for (const a of antData ?? []) {
    const y = sezonYili(a.tarih);
    antSayisi.set(y, (antSayisi.get(y) ?? 0) + 1);
  }

  const yillar = new Set<number>([bugunkuSezon(), ...macSayisi.keys(), ...antSayisi.keys()]);
  for (const y of arsiv?.sezonlar.keys() ?? []) yillar.add(y);
  const sirali = [...yillar].sort((a, b) => b - a);
  const bekleyen = arsiv ? sirali.filter((y) => sezonDurumu(y, arsiv.sezonlar.get(y)) === "kapanis_bekliyor") : [];

  return (
    <>
      <UstBaslik baslik="Sezonlar" altBaslik="Sezon kapatma ve altyapı arşivi" geri="/yonetim/daha" />

      <div className="mx-auto w-full max-w-3xl px-4 pb-28">
        {!arsiv ? (
          <div className="kart -mt-3 px-4 py-4">
            <p className="text-sm font-semibold text-neutral-900">Arşiv henüz kurulmadı</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Sezon mühürleme, anılar ve yükselenler için veritabanı güncellemesinin
              (<code>20261030_sezon_arsivi.sql</code>) uygulanması gerekiyor. Uygulanana kadar bu
              bölüm yalnızca sayıları gösterir.
            </p>
          </div>
        ) : (
          <div className="kart -mt-3 px-4 py-4">
            <p className="text-sm font-semibold text-neutral-900">Sezon nasıl kapanır?</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Sezon 31 Ağustos'ta biter. Skorları, kadroları ve yoklamaları kontrol edip sezonu
              mühürlediğinizde özet arşive işlenir ve o sezonun maç, antrenman ve yoklama
              kayıtları artık değiştirilemez. Fotoğraf, anı ve yükselen eklemek mühürden sonra da
              açıktır.
            </p>
            {bekleyen.length ? (
              <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">
                {bekleyen.map(sezonAdi).join(", ")} {bekleyen.length > 1 ? "sezonları" : "sezonu"} bitti, mühürlenmeyi bekliyor.
              </p>
            ) : null}
          </div>
        )}

        <div className="kart mt-4 divide-y divide-neutral-100">
          {sirali.map((y) => {
            const kayit = arsiv?.sezonlar.get(y);
            const durum = sezonDurumu(y, kayit);
            const ozet = ozetVarMi(kayit?.ozet) ? kayit!.ozet : null;
            const mac = ozet && durum === "muhurlu" ? ozet.mac : macSayisi.get(y) ?? 0;
            const ant = ozet && durum === "muhurlu" ? ozet.antrenman : antSayisi.get(y) ?? 0;
            return (
              <Link key={y} href={`/yonetim/sezonlar/${y}`} className="flex items-center gap-3 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-manset text-xl font-extrabold leading-none text-neutral-900">{sezonAdi(y)}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {mac} maç · {ant} antrenman
                    {kayit?.muhurleme_zamani && durum === "muhurlu"
                      ? ` · ${new Date(kayit.muhurleme_zamani).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} mühürlendi`
                      : ""}
                  </p>
                </div>
                {arsiv ? <span className={`rozet ${ROZET[durum]}`}>{SEZON_DURUM_ADI[durum]}</span> : null}
                <span className="text-neutral-400">›</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
