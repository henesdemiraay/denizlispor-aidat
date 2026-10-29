import { redirect } from "next/navigation";
import { anaEkran, oturum } from "@/lib/yetki";
import { guvenliYol } from "@/lib/yonlendirme";

export const dynamic = "force-dynamic";

/** Açılış ekranından sonra kişiyi rolüne uygun ana ekrana (ya da güvenli "devam" yoluna) gönderir. */
export default async function Yonlendir({ searchParams }: { searchParams: Promise<{ devam?: string }> }) {
  const { rol } = await oturum();
  const { devam } = await searchParams;
  redirect(devam ? guvenliYol(devam, anaEkran(rol)) : anaEkran(rol));
}
