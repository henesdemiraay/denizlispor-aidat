"use client";

import { useRouter } from "next/navigation";
import { ustEkranaDon } from "@/lib/gezinme";

/** Kenar menüsündeki ana bölümler: PC'de bunlara dönen "‹" gereksiz (menü zaten açık). */
const ANA_BOLUMLER = ["/yonetim", "/yonetim/daha", "/panel", "/antrenor"];

/** Başlıktaki "‹": her zaman bir üst ekrana (hedef) gider, gezilen ekranları geri sarmaz. */
export default function GeriDugmesi({ hedef }: { hedef: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Geri"
      onClick={() => ustEkranaDon(router, hedef)}
      className={`-ml-1 flex h-10 w-10 shrink-0 ${ANA_BOLUMLER.includes(hedef.split("?")[0]) ? "lg:hidden" : ""} items-center justify-center rounded-full bg-white/10 text-lg leading-none text-white active:scale-95`}
    >
      ‹
    </button>
  );
}
