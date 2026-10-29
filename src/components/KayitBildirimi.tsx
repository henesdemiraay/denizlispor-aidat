"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { oncekiYol } from "@/lib/gezinme";

type Bildirim = { tur: "tamam" | "uyari"; metin: string };

/**
 * Sorgu dizesinden gelen bildirimi gösterir:
 *  - ?kaydedildi=…  yeşil "✓" (3 sn)
 *  - ?uyari=…       kırmızı uyarı (7 sn) — ör. mühürlü sezona yazma denemesi.
 *    Sunucu hataları canlıda genel hata ekranına düştüğü için, kullanıcının
 *    düzeltebileceği hatalar bu yolla ekranda kalır.
 */
export default function KayitBildirimi() {
  const params = useSearchParams();
  const router = useRouter();
  const yol = usePathname();
  const kaydedildi = params.get("kaydedildi");
  const uyari = params.get("uyari");
  const [bildirim, setBildirim] = useState<Bildirim | null>(null);

  useEffect(() => {
    if (!kaydedildi) return;
    setBildirim({ tur: "tamam", metin: kaydedildi });
    if (oncekiYol() === yol) {
      // Liste → form → kaydet → aynı liste: geçmişte aynı ekran iki kez kalmasın,
      // bir önceki (güncellenmiş) kayda dönülür. Bildirim ekranda kalır.
      router.back();
      setTimeout(() => router.refresh(), 150);
    } else {
      router.replace(yol, { scroll: false });
    }
  }, [kaydedildi, router, yol]);

  useEffect(() => {
    if (!uyari) return;
    setBildirim({ tur: "uyari", metin: uyari });
    router.replace(yol, { scroll: false });
  }, [uyari, router, yol]);

  useEffect(() => {
    if (!bildirim) return;
    const t = setTimeout(() => setBildirim(null), bildirim.tur === "uyari" ? 7000 : 3200);
    return () => clearTimeout(t);
  }, [bildirim]);

  if (!bildirim) return null;

  if (bildirim.tur === "uyari") {
    return (
      <div role="alert" className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 lg:bottom-6 lg:pl-64 flex justify-center px-4">
        <button
          type="button"
          onClick={() => setBildirim(null)}
          className="yazi-giris flex max-w-md items-start gap-2 rounded-2xl bg-[#FFFFFF] px-4 py-3 text-left text-sm font-semibold text-siyah shadow-xl ring-2 ring-red-500"
        >
          <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] text-[#FFFFFF]">
            !
          </span>
          <span>{bildirim.metin}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 lg:bottom-6 lg:pl-64 flex justify-center px-4"
    >
      <div className="yazi-giris flex items-center gap-2 rounded-full bg-[#FFFFFF] px-4 py-2.5 text-sm font-semibold text-siyah shadow-xl">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yesil-500 text-[11px] text-anametin">
          ✓
        </span>
        {bildirim.metin}
      </div>
    </div>
  );
}
