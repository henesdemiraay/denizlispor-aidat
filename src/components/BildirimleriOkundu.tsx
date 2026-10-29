"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { bildirimleriOkundu } from "@/app/panel/actions";

/** Ekranda görülen okunmamış bildirimleri kısa bir süre sonra okundu işaretler. */
export default function BildirimleriOkundu({ var: okunmamisVar }: { var: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!okunmamisVar) return;
    const t = setTimeout(async () => {
      await bildirimleriOkundu();
      router.refresh();
    }, 1500);
    return () => clearTimeout(t);
  }, [okunmamisVar, router]);
  return null;
}
