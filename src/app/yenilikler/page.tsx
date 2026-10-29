import UstBaslik from "@/components/UstBaslik";
import { oturum } from "@/lib/yetki";
import { rolNotlari } from "@/lib/surumNotlari";

export const dynamic = "force-dynamic";

export default async function Yenilikler() {
  const { rol } = await oturum();
  const notlar = rolNotlari(rol);

  return (
    <div className="min-h-dvh bg-zemin">
      <UstBaslik baslik="Yenilikler" altBaslik="Uygulamadaki güncellemeler" geri="/panel/hesap" />
      <div className="mx-auto w-full max-w-3xl space-y-3 px-4 pb-16 pt-5">
        {notlar.map((n) => (
          <article key={n.surum} className="kart px-5 py-5">
            <p className="bolum-basligi">{n.tarih}</p>
            <h2 className="manset mt-1.5 text-[26px] text-white">{n.baslik}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-snug text-neutral-700 marker:text-yesil-500">
              {n.maddeler.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
