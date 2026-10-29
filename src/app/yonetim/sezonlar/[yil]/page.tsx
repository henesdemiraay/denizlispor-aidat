import { notFound } from "next/navigation";
import UstBaslik from "@/components/UstBaslik";
import KaydetDugmesi from "@/components/KaydetDugmesi";
import AniEkle from "@/components/AniEkle";
import { yoneticiGerekli } from "@/lib/yetki";
import {
  arsivFotolari,
  arsivGetir,
  ozetVarMi,
  SEZON_DURUM_ADI,
  sezonDurumu,
  type KadroSatiri,
  type SezonOzeti,
} from "@/lib/arsiv";
import { sezonAdi } from "@/lib/sezon";
import { gunAdi } from "@/lib/format";
import { aniSil, sezonMuhurAc, sezonMuhurle, sezonNotKaydet, yukselenKaydet, yukselenSil } from "../actions";

export const dynamic = "force-dynamic";

function tarihSaat(z: string) {
  return new Date(z).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

function EnIyiler({
  baslik,
  satirlar,
  deger,
  ad,
}: {
  baslik: string;
  satirlar: KadroSatiri[];
  deger: (k: KadroSatiri) => number;
  ad: (id: string) => string;
}) {
  const ilk = satirlar.filter((k) => deger(k) > 0).sort((a, b) => deger(b) - deger(a)).slice(0, 5);
  if (!ilk.length) return null;
  return (
    <div className="kart px-4 py-3">
      <p className="bolum-basligi">{baslik}</p>
      <ol className="mt-2 space-y-1.5">
        {ilk.map((k, i) => (
          <li key={k.sporcu_id} className="flex items-center gap-2 text-sm">
            <span className="w-4 font-mono text-[11px] text-neutral-400">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-neutral-900">{ad(k.sporcu_id)}</span>
            <span className="font-manset text-lg font-extrabold text-neutral-900">{deger(k)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function SezonDetayi({ params }: { params: Promise<{ yil: string }> }) {
  const { yil: yilMetni } = await params;
  const yil = Number(yilMetni);
  if (!Number.isInteger(yil) || yil < 2000 || yil > 2100) notFound();

  const { supabase } = await yoneticiGerekli();
  const arsiv = await arsivGetir(supabase);
  const kayit = arsiv?.sezonlar.get(yil);
  const durum = sezonDurumu(yil, kayit);

  // Mühürlüyse saklı özet; değilse canlı önizleme
  let ozet: SezonOzeti | null = ozetVarMi(kayit?.ozet) && durum === "muhurlu" ? kayit!.ozet : null;
  if (arsiv && !ozet) {
    const { data } = await supabase.rpc("spor_sezon_ozeti", { p_yil: yil });
    ozet = (data as SezonOzeti | null) ?? null;
  }

  const kadroIdleri = ozet?.kadro.map((k) => k.sporcu_id) ?? [];
  const [{ data: kadroData }, { data: sporcuData }] = await Promise.all([
    kadroIdleri.length
      ? supabase.from("spor_sporcular").select("id, ad, soyad").in("id", kadroIdleri)
      : Promise.resolve({ data: [] as { id: string; ad: string; soyad: string }[] }),
    supabase.from("spor_sporcular").select("id, ad, soyad, yas_grubu").eq("durum", "aktif").order("ad"),
  ]);
  const adlar = new Map((kadroData ?? []).map((s) => [s.id, `${s.ad} ${s.soyad}`]));
  const ad = (id: string) => adlar.get(id) ?? "Kaydı silinmiş sporcu";

  const anilar = (arsiv?.anilar ?? []).filter((a) => a.sezon_yil === yil);
  const yukselenler = (arsiv?.yukselenler ?? []).filter((y) => y.sezon_yil === yil);
  const fotolar = await arsivFotolari(supabase, [...anilar.map((a) => a.foto_yolu), ...yukselenler.map((y) => y.foto_yolu)]);

  const devam = (k: KadroSatiri) =>
    k.antrenman_sayilan >= 5 ? Math.round((100 * k.antrenman_geldi) / k.antrenman_sayilan) : 0;

  return (
    <>
      <UstBaslik baslik={`${sezonAdi(yil)} sezonu`} altBaslik={arsiv ? SEZON_DURUM_ADI[durum] : "Sezon özeti"} geri="/yonetim/sezonlar" />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-28">
        {!arsiv ? (
          <div className="kart -mt-3 px-4 py-4 text-sm text-neutral-500">
            Arşiv için veritabanı güncellemesi henüz uygulanmadı.
          </div>
        ) : null}

        {ozet ? (
          <section className="-mt-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-2.5">
              {[
                ["maç", ozet.mac],
                ["antrenman", ozet.antrenman],
                ["sporcu", ozet.sporcu],
                ["galibiyet", ozet.galibiyet],
                ["gol", `${ozet.gol_atilan}–${ozet.gol_yenilen}`],
                ["devam", ozet.devam_orani === null ? "–" : `%${ozet.devam_orani}`],
              ].map(([etiket, deger]) => (
                <div key={String(etiket)} className="kart px-3 py-3">
                  <p className="font-manset text-[26px] font-extrabold leading-none text-neutral-900">{String(deger)}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">{String(etiket)}</p>
                </div>
              ))}
            </div>
            <p className="px-1 text-xs text-neutral-500">
              {ozet.galibiyet}G · {ozet.beraberlik}B · {ozet.maglubiyet}M ·{" "}
              {Math.round(ozet.antrenman_dk / 60)} saat antrenman
              {ozet.yas_gruplari.length ? ` · ${ozet.yas_gruplari.join(", ")}` : ""}
              {durum === "muhurlu" ? " · mühürleme anındaki özet" : " · canlı önizleme"}
            </p>
          </section>
        ) : null}

        {ozet && ozet.kadro.length ? (
          <section className="grid gap-2.5 sm:grid-cols-3">
            <EnIyiler baslik="Gol" satirlar={ozet.kadro} deger={(k) => k.gol} ad={ad} />
            <EnIyiler baslik="Oynanan dakika" satirlar={ozet.kadro} deger={(k) => k.dakika} ad={ad} />
            <EnIyiler baslik="Devam % (en az 5 antrenman)" satirlar={ozet.kadro} deger={devam} ad={ad} />
          </section>
        ) : null}

        {arsiv ? (
          <>
            {/* ------------------------------------------------ mühür */}
            <section className="kart px-4 py-4">
              <h2 className="bolum-basligi">Mühür</h2>
              {durum === "suruyor" ? (
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  Sezon sürüyor. 31 Ağustos {yil + 1} sonrasında kayıtları kontrol edip mühürleyebilirsiniz.
                </p>
              ) : null}

              {durum === "kapanis_bekliyor" ? (
                <form action={sezonMuhurle} className="mt-2 space-y-3">
                  <input type="hidden" name="yil" value={yil} />
                  <p className="text-sm leading-relaxed text-neutral-600">
                    Mühürlemeden önce skorların, maç kadrolarının ve yoklamaların eksiksiz olduğundan
                    emin olun. Mühürden sonra bu sezonun kayıtları değiştirilemez.
                  </p>
                  <div>
                    <label className="etiket" htmlFor="kapanis_notu">Kapanış notu (veliler görür)</label>
                    <textarea id="kapanis_notu" name="kapanis_notu" rows={4} maxLength={2000} className="alan"
                      defaultValue={kayit?.kapanis_notu ?? ""}
                      placeholder="Sezonun hikâyesi: hedefler, unutulmaz anlar, teşekkürler…" />
                  </div>
                  <label className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <input type="checkbox" name="onay" required className="mt-0.5 h-5 w-5 accent-current" />
                    Skorları, kadroları ve yoklamaları kontrol ettim.
                  </label>
                  <KaydetDugmesi bekleyen="Mühürleniyor…">Sezonu mühürle</KaydetDugmesi>
                </form>
              ) : null}

              {durum === "muhurlu" && kayit ? (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-neutral-600">
                    {kayit.muhurleme_zamani ? `${tarihSaat(kayit.muhurleme_zamani)} tarihinde mühürlendi.` : "Mühürlü."}{" "}
                    Maç, kadro, antrenman ve yoklama kayıtları kilitli.
                  </p>
                  <details className="rounded-xl bg-neutral-50 px-3 py-2">
                    <summary className="cursor-pointer text-sm font-semibold text-neutral-700">Mührü aç (istisnai)</summary>
                    <form action={sezonMuhurAc} className="mt-3 space-y-3 pb-1">
                      <input type="hidden" name="yil" value={yil} />
                      <div>
                        <label className="etiket" htmlFor="neden">Gerekçe *</label>
                        <input id="neden" name="neden" className="alan" required minLength={5} maxLength={300}
                          placeholder="Ör. 12 Nisan maçının skoru yanlış girilmiş" />
                      </div>
                      <p className="text-xs text-neutral-500">Gerekçe sezon geçmişine yazılır. Düzeltmeden sonra yeniden mühürleyin.</p>
                      <KaydetDugmesi className="btn-ikincil w-full" bekleyen="Açılıyor…">Mührü aç</KaydetDugmesi>
                    </form>
                  </details>
                </div>
              ) : null}

              {kayit?.gecmis?.length ? (
                <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                  {kayit.gecmis.map((g, i) => (
                    <li key={i}>
                      {tarihSaat(g.zaman)} · {g.islem === "muhurle" ? "mühürlendi" : `mühür açıldı — ${g.neden ?? ""}`}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            {/* --------------------------------------- kapanış notu */}
            {durum === "muhurlu" ? (
              <form action={sezonNotKaydet} className="kart space-y-3 px-4 py-4">
                <input type="hidden" name="yil" value={yil} />
                <label className="bolum-basligi block" htmlFor="kapanis_notu_duzenle">Kapanış notu</label>
                <textarea id="kapanis_notu_duzenle" name="kapanis_notu" rows={4} maxLength={2000} className="alan"
                  defaultValue={kayit?.kapanis_notu ?? ""} placeholder="Sezonun hikâyesi…" />
                <KaydetDugmesi className="btn-ikincil w-full">Notu kaydet</KaydetDugmesi>
              </form>
            ) : null}

            {/* ---------------------------------------- yükselenler */}
            <section>
              <h2 className="mb-2 px-1 bolum-basligi">Bu sezon yükselenler</h2>
              {yukselenler.length ? (
                <div className="kart mb-2.5 divide-y divide-neutral-100">
                  {yukselenler.map((y) => (
                    <div key={y.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900">{y.ad_soyad}</p>
                        <p className="truncate text-xs text-neutral-500">
                          {y.hedef}{y.mevki ? ` · ${y.mevki}` : ""}{y.aciklama ? ` · ${y.aciklama}` : ""}
                        </p>
                      </div>
                      <form action={yukselenSil}>
                        <input type="hidden" name="yil" value={yil} />
                        <input type="hidden" name="id" value={y.id} />
                        <button className="text-xs font-semibold text-red-600" aria-label={`${y.ad_soyad} kaydını kaldır`}>Kaldır</button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : null}
              <details className="kart px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-neutral-900">+ Yükselen ekle</summary>
                <form action={yukselenKaydet} className="mt-3 space-y-3 pb-1">
                  <input type="hidden" name="yil" value={yil} />
                  <div>
                    <label className="etiket" htmlFor="y_sporcu">Sporcu (kayıtlıysa)</label>
                    <select id="y_sporcu" name="sporcu_id" className="alan" defaultValue="">
                      <option value="">— Listeden seçin ya da aşağıya adı yazın —</option>
                      {(sporcuData ?? []).map((s) => (
                        <option key={s.id} value={s.id}>{s.ad} {s.soyad}{s.yas_grubu ? ` · ${s.yas_grubu}` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="etiket" htmlFor="y_ad">Ad soyad</label>
                    <input id="y_ad" name="ad_soyad" className="alan" maxLength={80} placeholder="Eski sporcular için" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="etiket" htmlFor="y_hedef">Yükseldiği takım *</label>
                      <input id="y_hedef" name="hedef" className="alan" required maxLength={80} placeholder="A Takım" />
                    </div>
                    <div>
                      <label className="etiket" htmlFor="y_mevki">Mevki</label>
                      <input id="y_mevki" name="mevki" className="alan" maxLength={40} />
                    </div>
                  </div>
                  <div>
                    <label className="etiket" htmlFor="y_aciklama">Not</label>
                    <input id="y_aciklama" name="aciklama" className="alan" maxLength={500} placeholder="Ör. İlk profesyonel sözleşme" />
                  </div>
                  <KaydetDugmesi bekleyen="Ekleniyor…">Yükselenler rafına ekle</KaydetDugmesi>
                </form>
              </details>
            </section>

            {/* --------------------------------------------- anılar */}
            <section>
              <h2 className="mb-2 px-1 bolum-basligi">Anılar ve fotoğraflar</h2>
              {anilar.length ? (
                <div className="mb-2.5 grid grid-cols-2 gap-2.5">
                  {anilar.map((a) => {
                    const foto = a.foto_yolu ? fotolar.get(a.foto_yolu) : null;
                    return (
                      <figure key={a.id} className="kart overflow-hidden">
                        {foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={foto} alt={a.baslik} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                        ) : null}
                        <figcaption className="px-3 py-2.5">
                          <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{a.baslik}</p>
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            {[a.tarih ? gunAdi(a.tarih) : null, a.yas_grubu].filter(Boolean).join(" · ")}
                          </p>
                          <form action={aniSil} className="mt-1.5">
                            <input type="hidden" name="yil" value={yil} />
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="foto_yolu" value={a.foto_yolu ?? ""} />
                            <button className="text-[11px] font-semibold text-red-600">Kaldır</button>
                          </form>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              ) : null}
              <AniEkle yil={yil} />
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
