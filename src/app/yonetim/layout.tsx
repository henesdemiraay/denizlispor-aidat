import Kabuk from "@/components/Kabuk";
import { yoneticiGerekli } from "@/lib/yetki";
import { rizaGerekli } from "@/lib/riza";
import { YONETIM_MENUSU } from "@/lib/menuler";

export default async function YonetimLayout({ children }: { children: React.ReactNode }) {
  const { rol, profil, user } = await yoneticiGerekli();
  await rizaGerekli();
  return (
    <Kabuk menu={YONETIM_MENUSU} rol={rol} kullanici={profil?.ad_soyad ?? user.email ?? ""}>
      {children}
    </Kabuk>
  );
}
