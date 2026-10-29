import Link from "next/link";
import UstBaslik from "@/components/UstBaslik";
import Ikon, { type IkonAdi } from "@/components/ui/Ikon";
import BildirimleriOkundu from "@/components/BildirimleriOkundu";
import { oturum } from "@/lib/yetki";
import { anaEkranYolu } from "@/lib/roller";
import { BILDIRIM_TURU, bildirimleriGetir } from "@/lib/bildirim";

export const dynamic = "force-dynamic";

const IKON: Record<string, IkonAdi> = {
  aidat_yaklasiyor: "cuzdan",
  aidat_bugun: "cuzdan",
  aidat_gecikti: "cuzdan",
  yoklama_gelmedi: "takvim",
  odeme_onaylandi: "kontrol",
  odeme_reddedildi: "kontrol",
  kayit_onaylandi: "kisiler",
  yeni_odeme: "kontrol",
  yeni_kayit: "kisiler",
  deneme_dersi: "takvim",
};

function zaman(z: string) {
  const d = new Date(z);
  const bugun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const gun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
  const saat = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
  if (gun === bugun) return `Bugün ${saat}`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }) + ` · ${saat}`;
}

/** Bildirim kutusu. /yonetim/bildirimler ve /antrenor/bildirimler bu ekranı kendi menüleriyle açar. */
export default async function Bildirimler() {
  const { supabase, rol } = await oturum();
  const bildirimler = await bildirimleriGetir(supabase);
  const okunmamis = (bildirimler ?? []).filter((b) => !b.okundu).length;

  return (
    <>
      <UstBaslik
        baslik="Bildirimler"
        altBaslik={okunmamis ? `${okunmamis} yeni` : "Hepsi okundu"}
        geri={anaEkranYolu(rol)}
      />
      <BildirimleriOkundu var={okunmamis > 0} />

      <div className="mx-auto w-full max-w-3xl px-4 pb-28 lg:pb-12">
        {bildirimler === null ? (
          <div className="kart mt-4 px-5 py-8 text-center text-sm text-neutral-500">
            Bildirimler yakında burada olacak.
          </div>
        ) : bildirimler.length === 0 ? (
          <div className="kart mt-4 flex flex-col items-center px-5 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yesil-500/12 text-yesil-500">
              <Ikon ad="zil" className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-neutral-900">Henüz bildirim yok</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
              Aidat hatırlatmaları, ödeme onayları ve yoklama haberleri burada toplanır.
            </p>
          </div>
        ) : (
          <ul className="kart mt-4 divide-y divide-white/[0.06]">
            {bildirimler.map((b) => {
              const tur = BILDIRIM_TURU[b.tur] ?? { ad: "Bildirim" };
              const icerik = (
                <div className="flex gap-3.5 px-4 py-3.5">
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      tur.acil ? "bg-amber-100 text-amber-800" : "bg-yesil-500/12 text-yesil-500"
                    }`}
                  >
                    <Ikon ad={IKON[b.tur] ?? "zil"} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bolum-basligi">{tur.ad}</span>
                      <span className="text-[11px] text-neutral-500">{zaman(b.gorunur_zaman)}</span>
                      {!b.okundu ? <span aria-label="yeni" className="ml-auto h-2 w-2 rounded-full bg-yesil-500" /> : null}
                    </div>
                    <p className={`mt-0.5 text-sm ${b.okundu ? "font-medium text-neutral-700" : "font-semibold text-neutral-900"}`}>
                      {b.baslik}
                    </p>
                    {b.govde ? <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{b.govde}</p> : null}
                  </div>
                </div>
              );
              return (
                <li key={b.id}>
                  {b.yol ? (
                    <Link href={b.yol} className="block transition-colors duration-150 hover:bg-white/[0.03]">
                      {icerik}
                    </Link>
                  ) : (
                    icerik
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
