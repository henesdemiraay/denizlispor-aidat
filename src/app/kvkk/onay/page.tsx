import AuthKabuk from "@/components/AuthKabuk";
import KaydetDugmesi from "@/components/KaydetDugmesi";
import { oturum, anaEkran } from "@/lib/yetki";
import { aydinlatmaMetni, KVKK_SURUMU } from "@/lib/kvkk";
import { sonRiza } from "@/lib/riza";
import { rizaKaydet } from "@/app/panel/actions";
import { gunAdi } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kişisel veriler" };

export default async function KvkkOnay({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const { hata } = await searchParams;
  const { rol } = await oturum();
  const onceki = await sonRiza();
  const guncel = onceki && onceki.metin_surumu === KVKK_SURUMU;

  return (
    <AuthKabuk
      baslik={guncel ? "İzinlerim" : "Bir adım kaldı"}
      altBaslik={
        guncel
          ? `${gunAdi(onceki.created_at)} tarihinde onayladınız. Dilediğiniz zaman değiştirebilirsiniz.`
          : "Çocuğunuzun verisi bizim için emanettir. Lütfen nasıl kullandığımızı okuyup onaylayın."
      }
    >
      <details className="kart px-4 py-3" open={!guncel}>
        <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
          Aydınlatma metni (sürüm {KVKK_SURUMU})
        </summary>
        <div className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
          {aydinlatmaMetni().map((b) => (
            <section key={b.baslik}>
              <h3 className="bolum-basligi">{b.baslik}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-700">{b.metin}</p>
            </section>
          ))}
        </div>
      </details>

      <form action={rizaKaydet} className="mt-5 space-y-3">
        <input type="hidden" name="devam" value={anaEkran(rol)} />
        {[
          { ad: "aydinlatma", metin: "Aydınlatma metnini okudum ve anladım.", zorunlu: true, varsayilan: true },
          {
            ad: "acik_riza",
            metin: "Fotoğraf, gelişim değerlendirmesi ve fiziksel ölçümlerin kulüp içinde işlenmesine açık rıza veriyorum.",
            zorunlu: false,
            varsayilan: onceki?.acik_riza ?? false,
          },
          {
            ad: "iletisim",
            metin: "Antrenman, maç ve aidat hatırlatmalarını almak istiyorum.",
            zorunlu: false,
            varsayilan: onceki?.iletisim ?? true,
          },
        ].map((k) => (
          <label key={k.ad} className="kart flex items-start gap-3 px-4 py-3.5">
            <input
              type="checkbox"
              name={k.ad}
              defaultChecked={k.varsayilan}
              required={k.zorunlu}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--marka)]"
            />
            <span className="text-sm leading-relaxed text-neutral-800">
              {k.metin}
              {k.zorunlu ? <span className="text-neutral-500"> (zorunlu)</span> : null}
            </span>
          </label>
        ))}
        {hata ? <p className="text-sm text-red-700">{hata}</p> : null}
        <p className="px-1 text-xs leading-relaxed text-neutral-500">
          Açık rıza vermeseniz de uygulamayı kullanabilirsiniz; bu durumda fotoğraf ve gelişim verileri işlenmez.
        </p>
        <KaydetDugmesi>{guncel ? "İzinleri güncelle" : "Onayla ve devam et"}</KaydetDugmesi>
      </form>
    </AuthKabuk>
  );
}
