import Ikon from "@/components/ui/Ikon";
import { gunAdi } from "@/lib/format";
import { HEDEF_ROL_ADI, type Duyuru } from "@/lib/duyuru";

export default function DuyuruKarti({
  d,
  yeni,
  hedefGoster,
  children,
}: {
  d: Duyuru;
  yeni?: boolean;
  hedefGoster?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article
      className={`kart px-4 py-4 ${d.onemli ? "ring-1 ring-yesil-500/50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            d.onemli ? "bg-yesil-500 text-anametin" : "bg-yesil-50 text-yesil-700"
          }`}
        >
          <Ikon ad="megafon" className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[15px] font-bold text-neutral-900">{d.baslik}</h3>
            {yeni ? <span className="rozet bg-yesil-500 text-anametin">Yeni</span> : null}
            {d.onemli ? <span className="rozet bg-amber-100 text-amber-900">Önemli</span> : null}
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{d.icerik}</p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-neutral-500">
            {gunAdi(d.created_at)}
            {hedefGoster ? ` · ${HEDEF_ROL_ADI[d.hedef_rol]}` : ""}
            {d.hedef_yas_grubu ? ` · ${d.hedef_yas_grubu}` : ""}
            {d.bitis_tarihi ? ` · ${gunAdi(d.bitis_tarihi)} tarihine kadar` : ""}
          </p>
          {children}
        </div>
      </div>
    </article>
  );
}
