import Link from "next/link";
import Ikon from "@/components/ui/Ikon";
import { createClient } from "@/lib/supabase/server";
import { okunmamisSayisi } from "@/lib/bildirim";

/** Başlıktaki zil: okunmamış bildirim sayısını gösterir. `yol`: rolün bildirim ekranı. */
export default async function BildirimZili({ yol }: { yol: string }) {
  const supabase = await createClient();
  const sayi = await okunmamisSayisi(supabase);
  return (
    <Link
      href={yol}
      aria-label={sayi ? `Bildirimler, ${sayi} okunmamış` : "Bildirimler"}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition-colors duration-150 hover:bg-white/20"
    >
      <Ikon ad="zil" className="h-5 w-5" />
      {sayi ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-yesil-500 px-1 font-mono text-[10px] font-bold text-anametin ring-2 ring-siyah">
          {sayi > 9 ? "9+" : sayi}
        </span>
      ) : null}
    </Link>
  );
}
