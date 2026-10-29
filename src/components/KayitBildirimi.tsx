"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { oncekiYol } from "@/lib/gezinme";

export default function KayitBildirimi() {
  const params = useSearchParams();
  const router = useRouter();
  const yol = usePathname();
  const gelen = params.get("kaydedildi");
  const [mesaj, setMesaj] = useState<string | null>(null);

  useEffect(() => {
    if (!gelen) return;
    setMesaj(gelen);
    if (oncekiYol() === yol) {
      // Liste → form → kaydet → aynı liste: geçmişte aynı ekran iki kez kalmasın,
      // bir önceki (güncellenmiş) kayda dönülür. Bildirim ekranda kalır.
      router.back();
      setTimeout(() => router.refresh(), 150);
    } else {
      router.replace(yol, { scroll: false });
    }
  }, [gelen, router, yol]);

  useEffect(() => {
    if (!mesaj) return;
    const t = setTimeout(() => setMesaj(null), 3200);
    return () => clearTimeout(t);
  }, [mesaj]);

  if (!mesaj) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="yazi-giris flex items-center gap-2 rounded-full bg-[#FFFFFF] px-4 py-2.5 text-sm font-semibold text-siyah shadow-xl">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yesil-500 text-[11px] text-anametin">
          ✓
        </span>
        {mesaj}
      </div>
    </div>
  );
}
