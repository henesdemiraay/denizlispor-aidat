import AltMenu from "@/components/AltMenu";
import YanMenu from "@/components/YanMenu";
import CikisDugmesi from "@/components/CikisDugmesi";
import SurumNotlari from "@/components/SurumNotlari";
import { rozetEkle, type Menu } from "@/lib/menuler";
import { createClient } from "@/lib/supabase/server";
import { okunmamisSayisi } from "@/lib/bildirim";
import { rolAdi } from "@/lib/roller";

/**
 * Girişli ekranların ortak kabuğu.
 * Telefon / tablet: içerik + alttaki sekme çubuğu.
 * Geniş ekran (≥1024 px): solda sabit kenar menüsü, içerik sağda; alt çubuk gizli.
 */
export default async function Kabuk({
  menu,
  rol,
  kullanici,
  children,
}: {
  menu: Menu;
  rol: string;
  kullanici: string;
  children: React.ReactNode;
}) {
  const okunmamis = await okunmamisSayisi(await createClient());
  const yan = rozetEkle(menu, okunmamis).yan;
  return (
    <div className="kabuk min-h-dvh bg-zemin">
      <YanMenu
        gruplar={yan}
        kullanici={kullanici}
        rolAdi={rolAdi(rol)}
        alt={<CikisDugmesi tam />}
      />
      <div className="lg:pl-64">{children}</div>
      <AltMenu ogeler={menu.alt} />
      <SurumNotlari rol={rol} />
    </div>
  );
}
