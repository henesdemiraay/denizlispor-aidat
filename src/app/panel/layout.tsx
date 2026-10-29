import AltMenu, { type MenuOgesi } from "@/components/AltMenu";
import SurumNotlari from "@/components/SurumNotlari";
import { oturum } from "@/lib/yetki";

const MENU: MenuOgesi[] = [
  { yol: "/panel", ad: "Ana sayfa", ikon: "ev" },
  { yol: "/panel/antrenman", ad: "Antrenman", ikon: "takvim" },
  { yol: "/panel/maclar", ad: "Maçlar", ikon: "futbol" },
  { yol: "/panel/hesap", ad: "Hesabım", ikon: "kisiler" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { rol } = await oturum();
  return (
    <div className="min-h-dvh bg-zemin">
      {children}
      <AltMenu ogeler={MENU} />
      <SurumNotlari rol={rol} />
    </div>
  );
}
