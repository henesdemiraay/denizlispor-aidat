import AltMenu, { type MenuOgesi } from "@/components/AltMenu";
import SurumNotlari from "@/components/SurumNotlari";
import { yoneticiGerekli } from "@/lib/yetki";

const MENU: MenuOgesi[] = [
  { yol: "/yonetim", ad: "Özet", ikon: "ev" },
  { yol: "/yonetim/sporcular", ad: "Sporcular", ikon: "kisiler" },
  { yol: "/yonetim/aidatlar", ad: "Aidatlar", ikon: "cuzdan" },
  { yol: "/yonetim/odemeler", ad: "Ödemeler", ikon: "grafik" },
  { yol: "/yonetim/daha", ad: "Daha", ikon: "daha" },
];

export default async function YonetimLayout({ children }: { children: React.ReactNode }) {
  const { rol } = await yoneticiGerekli();
  return (
    <div className="min-h-dvh bg-zemin">
      {children}
      <AltMenu ogeler={MENU} />
      <SurumNotlari rol={rol} />
    </div>
  );
}
