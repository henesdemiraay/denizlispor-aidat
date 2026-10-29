"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { yerDegistirAl, yiginOku, yiginYaz } from "@/lib/gezinme";

/** Açılış, yönlendirme ve onay ekranları geri yığınında kalmaz. */
const KAPI_EKRANLARI = ["/", "/git", "/kvkk/onay"];

/**
 * Tarayıcı geçmişini sessionStorage'daki yığınla eş tutar.
 * - Geri/ileri tuşu (popstate): yığın o ekrana kadar geri sarılır.
 * - İşaretli geçiş ya da kaydetme dönüşü (?kaydedildi): en üstteki kaydın yerine yazılır.
 * - Diğer her geçiş: yeni ekran olarak eklenir.
 */
export default function GezinmeIzi() {
  const yol = usePathname();
  const popstate = useRef(false);
  const ilk = useRef(true);

  useEffect(() => {
    const dinle = () => {
      popstate.current = true;
    };
    window.addEventListener("popstate", dinle);
    return () => window.removeEventListener("popstate", dinle);
  }, []);

  useEffect(() => {
    const yigin = yiginOku();
    const yerDegistir =
      yerDegistirAl() ||
      window.location.search.includes("kaydedildi=") ||
      window.location.search.includes("uyari=") ||
      KAPI_EKRANLARI.includes(yigin[yigin.length - 1] ?? "");

    if (popstate.current) {
      const i = yigin.lastIndexOf(yol);
      if (i >= 0) yigin.splice(i + 1);
      else yigin.push(yol);
    } else if (ilk.current) {
      // ilk açılış ya da sayfa yenileme
      if (yigin[yigin.length - 1] !== yol) yigin.push(yol);
    } else if (yerDegistir && yigin.length) {
      yigin[yigin.length - 1] = yol;
    } else {
      yigin.push(yol);
    }

    popstate.current = false;
    ilk.current = false;
    yiginYaz(yigin);
  }, [yol]);

  return null;
}
