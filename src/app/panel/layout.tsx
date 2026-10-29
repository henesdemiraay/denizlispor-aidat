import Kabuk from "@/components/Kabuk";
import { oturum } from "@/lib/yetki";
import { rizaGerekli } from "@/lib/riza";
import { anaEkranYolu, personelMi } from "@/lib/roller";
import { SPORCU_MENUSU, VELI_MENUSU, type Menu } from "@/lib/menuler";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { rol, profil, user } = await oturum();
  await rizaGerekli();
  const temel = rol === "sporcu" ? SPORCU_MENUSU : VELI_MENUSU;
  // Personel kendi paneline geniş ekranda tek tıkla dönebilsin
  const menu: Menu = personelMi(rol)
    ? {
        alt: temel.alt,
        yan: [
          ...temel.yan,
          { baslik: "Kulüp", ogeler: [{ yol: anaEkranYolu(rol), ad: "Personel paneline dön", ikon: "pano" }] },
        ],
      }
    : temel;
  return (
    <Kabuk menu={menu} rol={rol} kullanici={profil?.ad_soyad ?? user.email ?? ""}>
      {children}
    </Kabuk>
  );
}
