import Kabuk from "@/components/Kabuk";
import { personelGerekli, yoneticiMi } from "@/lib/yetki";
import { rizaGerekli } from "@/lib/riza";
import { ANTRENOR_MENUSU, YONETIM_MENUSU } from "@/lib/menuler";

export default async function AntrenorLayout({ children }: { children: React.ReactNode }) {
  const { rol, profil, user } = await personelGerekli();
  await rizaGerekli();
  // Yönetim antrenman/gelişim ekranlarını kullanırken kendi menüsünde kalır
  const menu = yoneticiMi(rol) ? YONETIM_MENUSU : ANTRENOR_MENUSU;
  return (
    <Kabuk menu={menu} rol={rol} kullanici={profil?.ad_soyad ?? user.email ?? ""}>
      {children}
    </Kabuk>
  );
}
