"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Ikon from "@/components/ui/Ikon";
import { yerDegistirIsaretle } from "@/lib/gezinme";
import { aktifYol, type MenuOgesi } from "@/lib/menuler";

export type { MenuOgesi };

export default function AltMenu({ ogeler }: { ogeler: MenuOgesi[] }) {
  const yol = usePathname();

  // En uzun eşleşen yol aktif kabul edilir; böylece /panel/sporcu/x -> "Bugün",
  // /panel/antrenman -> "Antrenman" olur.
  const aktif = aktifYol(yol, ogeler.map((o) => o.yol));

  return (
    <nav aria-label="Sekmeler"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-siyah/95 backdrop-blur-lg print:hidden lg:hidden">
      <div
        className="mx-auto flex w-full max-w-3xl items-stretch"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        {ogeler.map((o) => {
          const secili = aktif === o.yol;
          return (
            <Link
              key={o.yol}
              href={o.yol}
              // Sekmeler arası geçiş geçmişe yazılmaz (telefon uygulamalarındaki gibi):
              // geri tuşu gezilen sekmeleri tek tek geri sarmaz.
              replace
              aria-current={secili ? "page" : undefined}
              onClick={() => {
                if (yol !== o.yol) yerDegistirIsaretle();
              }}
              className="group relative flex min-h-14 flex-1 flex-col items-center gap-1 px-1 pb-1.5 pt-2.5"
            >
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                  secili ? "bg-yesil-500/15 text-yesil-500" : "text-neutral-400"
                }`}
              >
                <Ikon ad={o.ikon} className="h-[22px] w-[22px]" />
              </span>
              <span
                className={`text-[11px] font-semibold leading-none ${
                  secili ? "font-bold text-yesil-500" : "text-neutral-500"
                }`}
              >
                {o.ad}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
