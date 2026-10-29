import UstBaslik from "@/components/UstBaslik";
import Ikon from "@/components/ui/Ikon";
import { yoneticiGerekli } from "@/lib/yetki";
import { DISA_AKTARIMLAR } from "@/lib/disaAktar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dışa aktar" };

export default async function DisaAktar() {
  await yoneticiGerekli();

  return (
    <>
      <UstBaslik baslik="Dışa aktar" altBaslik="Excel ile açılan CSV dosyaları" geri="/yonetim/daha" />

      <div className="mx-auto w-full max-w-3xl px-4 pb-28">
        <div className="kart -mt-3 divide-y divide-neutral-100">
          {Object.entries(DISA_AKTARIMLAR).map(([kod, t]) => (
            <a key={kod} href={`/yonetim/disa-aktar/${kod}`} download className="flex items-center gap-3.5 px-4 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yesil-50 text-yesil-700">
                <Ikon ad="indir" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">
                  {t.ad}
                  {t.kisisel ? (
                    <span className="rozet ml-2 bg-amber-100 align-middle text-amber-900">kişisel veri</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-neutral-500">{t.aciklama}</p>
              </div>
            </a>
          ))}
        </div>

        <p className="mt-4 px-1 text-xs leading-relaxed text-neutral-500">
          Kişisel veri içeren dosyaları yalnızca kulüp işleri için kullanın, paylaşmayın ve işiniz bitince
          silin (KVKK). Dosyalar Excel&apos;in Türkçe ayarlarıyla doğrudan açılır.
        </p>
      </div>
    </>
  );
}
