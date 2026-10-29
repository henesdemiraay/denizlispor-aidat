import KaydetDugmesi from "@/components/KaydetDugmesi";
import { ZIMMET_ONERI } from "@/lib/zimmet";
import { zimmetEkle } from "@/app/yonetim/actions";

/** Yeni zimmet formu. Sporcu seçimi ya sabit (sporcuId) ya da listeden. */
export default function ZimmetForm({
  bugun,
  donus,
  sporcuId,
  sporcular,
}: {
  bugun: string;
  donus: string;
  sporcuId?: string;
  sporcular?: { id: string; ad: string; soyad: string; yas_grubu: string | null }[];
}) {
  return (
    <form action={zimmetEkle} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="donus" value={donus} />
      {sporcuId ? (
        <input type="hidden" name="sporcu_id" value={sporcuId} />
      ) : (
        <div className="sm:col-span-2">
          <label className="etiket" htmlFor="z-sporcu">Sporcu</label>
          <select id="z-sporcu" name="sporcu_id" className="alan" required defaultValue="">
            <option value="" disabled>Seçin</option>
            {(sporcular ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad} {s.soyad}{s.yas_grubu ? ` · ${s.yas_grubu}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="etiket" htmlFor="z-esya">Eşya</label>
        <input id="z-esya" name="esya" className="alan" list="z-oneri" required maxLength={80} placeholder="Maç forması" />
        <datalist id="z-oneri">
          {ZIMMET_ONERI.map((o) => <option key={o} value={o} />)}
        </datalist>
      </div>
      <div>
        <label className="etiket" htmlFor="z-beden">Beden / numara</label>
        <input id="z-beden" name="beden" className="alan" maxLength={20} placeholder="S, 10 numara…" />
      </div>
      <div>
        <label className="etiket" htmlFor="z-adet">Adet</label>
        <input id="z-adet" name="adet" type="number" min={1} max={99} defaultValue={1} className="alan" />
      </div>
      <div>
        <label className="etiket" htmlFor="z-verilis">Veriliş</label>
        <input id="z-verilis" name="verilis" type="date" className="alan" defaultValue={bugun} required />
      </div>
      <div>
        <label className="etiket" htmlFor="z-iade">İade tarihi (isteğe bağlı)</label>
        <input id="z-iade" name="iade_beklenen" type="date" className="alan" min={bugun} />
      </div>
      <div className="sm:col-span-2">
        <label className="etiket" htmlFor="z-not">Not</label>
        <input id="z-not" name="notlar" className="alan" maxLength={300} placeholder="Depozito alındı, sezon sonu iade…" />
      </div>
      <p className="text-xs leading-relaxed text-neutral-500 sm:col-span-2">
        İade tarihi geçerse veliye ertesi gün ve bir hafta sonra hatırlatma gider.
      </p>
      <div className="sm:col-span-2">
        <KaydetDugmesi bekleyen="Kaydediliyor…" className="btn-birincil w-full">Zimmete ekle</KaydetDugmesi>
      </div>
    </form>
  );
}
