"use client";

import { useRouter } from "next/navigation";
import { ustEkranaDon } from "@/lib/gezinme";

/** Başlıktaki "‹": her zaman bir üst ekrana (hedef) gider, gezilen ekranları geri sarmaz. */
export default function GeriDugmesi({ hedef }: { hedef: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Geri"
      onClick={() => ustEkranaDon(router, hedef)}
      className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg leading-none text-white active:scale-95"
    >
      ‹
    </button>
  );
}
