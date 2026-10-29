import KaydetDugmesi from "@/components/KaydetDugmesi";
import { gunAdi } from "@/lib/format";
import { ZIMMET_DURUMU, zimmetDurumu, zimmetSirala, type Zimmet } from "@/lib/zimmet";
import { zimmetIade, zimmetSil } from "@/app/yonetim/actions";

type Satir = Zimmet & { sporcu?: { ad: string; soyad: string } | null };

/** Zimmet listesi. `donus` verilirse yönetim düğmeleri (iade al / sil) görünür. */
export default function ZimmetListesi({
  liste,
  bugun,
  donus,
  sporcuGoster = false,
  bos = "Zimmetli eşya yok.",
}: {
  liste: Satir[];
  bugun: string;
  donus?: string;
  sporcuGoster?: boolean;
  bos?: string;
}) {
  if (!liste.length) return <p className="kart px-4 py-5 text-sm text-neutral-500">{bos}</p>;
  return (
    <ul className="kart divide-y divide-neutral-100">
      {zimmetSirala(liste, bugun).map((z) => {
        const d = zimmetDurumu(z, bugun);
        return (
          <li key={z.id} className={`px-4 py-3 ${d === "iade" ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900">
                  {z.adet > 1 ? `${z.adet} × ` : ""}
                  {z.esya}
                  {z.beden ? <span className="font-normal text-neutral-500"> · {z.beden}</span> : null}
                </p>
                {sporcuGoster && z.sporcu ? (
                  <p className="text-xs font-semibold text-neutral-700">{z.sporcu.ad} {z.sporcu.soyad}</p>
                ) : null}
                <p className="text-xs text-neutral-500">
                  Verildi {gunAdi(z.verilis)}
                  {z.iade_edildi
                    ? ` · iade ${gunAdi(z.iade_edildi)}`
                    : z.iade_beklenen
                      ? ` · iade ${gunAdi(z.iade_beklenen)}`
                      : " · süresiz"}
                </p>
                {z.notlar ? <p className="mt-0.5 text-xs text-neutral-500">{z.notlar}</p> : null}
              </div>
              <span className={`rozet shrink-0 ${ZIMMET_DURUMU[d].sinif}`}>{ZIMMET_DURUMU[d].ad}</span>
            </div>
            {donus && d !== "iade" ? (
              <div className="mt-2 flex gap-2">
                <form action={zimmetIade} className="flex-1">
                  <input type="hidden" name="id" value={z.id} />
                  <input type="hidden" name="donus" value={donus} />
                  <KaydetDugmesi bekleyen="Kaydediliyor…" className="btn-ikincil w-full py-2 text-sm">
                    İade alındı
                  </KaydetDugmesi>
                </form>
                <details className="relative">
                  <summary className="btn cursor-pointer list-none py-2 text-sm text-neutral-500">Sil</summary>
                  <form action={zimmetSil} className="absolute right-0 z-10 mt-1 w-56 rounded-xl bg-yuzey p-3 shadow-lg ring-1 ring-neutral-200">
                    <input type="hidden" name="id" value={z.id} />
                    <input type="hidden" name="donus" value={donus} />
                    <p className="mb-2 text-xs text-neutral-600">Kayıt tamamen silinsin mi? İade için “İade alındı”yı kullanın.</p>
                    <KaydetDugmesi bekleyen="…" className="btn w-full bg-red-50 py-2 text-sm text-red-700 ring-1 ring-red-600/20">
                      Evet, sil
                    </KaydetDugmesi>
                  </form>
                </details>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
