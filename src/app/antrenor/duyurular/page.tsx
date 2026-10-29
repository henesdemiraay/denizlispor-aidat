import UstBaslik from "@/components/UstBaslik";
import DuyuruKarti from "@/components/DuyuruKarti";
import KaydetDugmesi from "@/components/KaydetDugmesi";
import { personelGerekli } from "@/lib/yetki";
import { duyurulariGetir, HEDEF_ROL_ADI } from "@/lib/duyuru";
import { yoneticiMi } from "@/lib/roller";
import { duyuruKaydet, duyuruSil } from "@/app/antrenor/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Duyurular" };

export default async function DuyuruYonetimi() {
  const { supabase, user, rol } = await personelGerekli();

  const [sonuc, { data: grupData }] = await Promise.all([
    duyurulariGetir(supabase, { rol, kullaniciId: user.id, hepsi: true, limit: 60 }),
    supabase.from("spor_sporcular").select("yas_grubu").eq("durum", "aktif"),
  ]);
  const gruplar = [...new Set((grupData ?? []).map((g) => g.yas_grubu).filter(Boolean) as string[])].sort();

  if (sonuc === null) {
    return (
      <>
        <UstBaslik baslik="Duyurular" altBaslik="Velilere ve sporculara" geri="/antrenor" />
        <div className="mx-auto w-full max-w-3xl px-4 pb-28">
          <div className="kart mt-4 px-5 py-8 text-center">
            <p className="font-semibold text-neutral-900">Duyurular henüz açılmadı</p>
            <p className="mt-1.5 text-sm text-neutral-500">
              Bu özellik için veritabanı güncellemesi bekleniyor (yönetici kurulumu).
            </p>
          </div>
        </div>
      </>
    );
  }

  const idler = sonuc.duyurular.map((d) => d.id);
  const { data: okunmaData } = idler.length
    ? await supabase.from("spor_duyuru_okunma").select("duyuru_id").in("duyuru_id", idler)
    : { data: [] as { duyuru_id: string }[] };
  const okunma = new Map<string, number>();
  for (const o of okunmaData ?? []) okunma.set(o.duyuru_id, (okunma.get(o.duyuru_id) ?? 0) + 1);
  const bugun = new Date().toISOString().slice(0, 10);

  return (
    <>
      <UstBaslik baslik="Duyurular" altBaslik="Velilere ve sporculara" geri="/antrenor" />

      <div className="mx-auto w-full max-w-3xl px-4 pb-28">
        <details className="kart mt-4 px-4 py-4" open={sonuc.duyurular.length === 0}>
          <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-neutral-900">
            Yeni duyuru
            <span className="text-yesil-700">+</span>
          </summary>
          <form action={duyuruKaydet} className="mt-4 space-y-3">
            <div>
              <label className="etiket" htmlFor="baslik">Başlık</label>
              <input id="baslik" name="baslik" required minLength={2} maxLength={120} className="alan"
                placeholder="Cumartesi antrenmanı 10.00'a alındı" />
            </div>
            <div>
              <label className="etiket" htmlFor="icerik">Metin</label>
              <textarea id="icerik" name="icerik" required maxLength={2000} rows={4} className="alan" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiket" htmlFor="hedef_rol">Kime</label>
                <select id="hedef_rol" name="hedef_rol" className="alan" defaultValue="herkes">
                  {Object.entries(HEDEF_ROL_ADI).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="etiket" htmlFor="hedef_yas_grubu">Yaş grubu</label>
                <select id="hedef_yas_grubu" name="hedef_yas_grubu" className="alan" defaultValue="">
                  <option value="">Tümü</option>
                  {gruplar.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 items-end gap-3">
              <div>
                <label className="etiket" htmlFor="bitis_tarihi">Yayından kalkış</label>
                <input id="bitis_tarihi" name="bitis_tarihi" type="date" min={bugun} className="alan" />
              </div>
              <label className="flex min-h-[50px] items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="onemli" className="h-5 w-5 accent-[var(--marka)]" />
                Önemli (üstte sabit)
              </label>
            </div>
            <KaydetDugmesi bekleyen="Yayınlanıyor…">Yayınla</KaydetDugmesi>
          </form>
        </details>

        <div className="mt-4 space-y-2.5">
          {sonuc.duyurular.map((d) => {
            const bitti = d.bitis_tarihi && d.bitis_tarihi < bugun;
            return (
              <div key={d.id} className={bitti ? "opacity-55" : ""}>
                <DuyuruKarti d={d} hedefGoster>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {bitti ? "Yayından kalktı · " : ""}
                      {okunma.get(d.id) ?? 0} kişi okudu
                    </span>
                    {yoneticiMi(rol) ? (
                      <form action={duyuruSil}>
                        <input type="hidden" name="id" value={d.id} />
                        <button className="text-xs font-semibold text-red-700">Kaldır</button>
                      </form>
                    ) : null}
                  </div>
                </DuyuruKarti>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
