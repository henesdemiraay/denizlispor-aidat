"use client";

import { useEffect } from "react";
import { duyurulariOkundu } from "@/app/panel/actions";

/** Ekranda gösterilen okunmamış duyuruları bir kez okundu olarak işaretler. */
export default function OkunduIsaretle({ idler }: { idler: string[] }) {
  const anahtar = idler.join(",");
  useEffect(() => {
    if (!anahtar) return;
    const t = setTimeout(() => void duyurulariOkundu(anahtar.split(",")), 1200);
    return () => clearTimeout(t);
  }, [anahtar]);
  return null;
}
