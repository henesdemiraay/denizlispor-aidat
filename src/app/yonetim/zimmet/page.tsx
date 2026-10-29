import UstBaslik from "@/components/UstBaslik";
import ZimmetForm from "@/components/ZimmetForm";
import ZimmetListesi from "@/components/ZimmetListesi";
import { yoneticiGerekli } from "@/lib/yetki";
import { tabloYok } from "@/lib/ozellik";
import { bugunTR } from "@/lib/sezon";
import { zimmetDurumu, type Zimmet } from "@/lib/zimmet";

export const dynamic = "force-dynamic";

export default async function ZimmetSayfasi({ searchParams }: { searchParams: Promise<{ goster?: string }> }) {
  const { goster } = await searchParams;
  const tumu = goster === "tumu";
  const { supabase } = await yoneticiGerekli();
  const bugun = bugunTR();

  let sorgu = supabase
    .from("spor_zimmetler")
    .select("*, sporcu:spor_sporcular(ad, soyad)")
    .order("verilis", { ascending: false })
    .limit(500);
  if (!tumu) sorgu = sorgu.is("iade_edildi", null);
  const [{ data, error }, { data: sporcular }] = await Promise.all([
    sorgu,
    supabase.from("spor_sporcular").select("id, ad, soyad, yas_grubu").eq("durum", "aktif").order("ad"),
  ]);

  if (tabloYok(error)) {
    return (
      <>
        <UstBaslik baslik="Zimmet" geri="/yonetim/daha" />
        <p className="kart mx-4 mt-4 px-4 py-5 text-sm text-neutral-600">
          Zimmet özelliği için veritabanı güncellemesi (20261103_zimmet.sql) henüz uygulanmadı.
        </p>
      </>
    );
  }

  const liste = (data ?? []) as (Zimmet & { sporcu: { ad: string; soyad: string } | null })[];
  const acik = liste.filter((z) => !z.iade_edildi);
  const geciken = acik.filter((z) => zimmetDurumu(z, bugun) === "gecikti").length;
  const parca = acik.reduce((t, z) => t + z.adet, 0);

  return (
    <>
      <UstBaslik
        genis
        baslik="Zimmet"
        altBaslik={`${parca} parça sporcularda${geciken ? ` · ${geciken} kayıt gecikmede` : ""}`}
        geri="/yonetim/daha"
      />
      <div className="mx-auto w-full max-w-5xl px-4 pb-28 lg:pb-12">
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="bolum-basligi">{tumu ? "Tüm kayıtlar" : "Sporcudaki eşyalar"}</h2>
              <a href={tumu ? "/yonetim/zimmet" : "/yonetim/zimmet?goster=tumu"} className="text-xs font-semibold text-yesil-700">
                {tumu ? "Yalnızca açıkları göster" : "İade alınanlar dahil"}
              </a>
            </div>
            <ZimmetListesi
              liste={liste}
              bugun={bugun}
              donus={tumu ? "/yonetim/zimmet?goster=tumu" : "/yonetim/zimmet"}
              sporcuGoster
              bos="Şu an sporcularda kulübe ait eşya yok."
            />
          </section>
          <aside>
            <div className="kart px-4 py-4">
              <p className="mb-3 text-sm font-bold text-neutral-900">Yeni zimmet</p>
              <ZimmetForm bugun={bugun} donus="/yonetim/zimmet" sporcular={sporcular ?? []} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
