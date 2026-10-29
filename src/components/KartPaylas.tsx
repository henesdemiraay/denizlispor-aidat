"use client";

import { useState } from "react";

/**
 * Sezon Kartı'nı yüksek çözünürlüklü PNG olarak üretir. Telefonda paylaşım menüsünü
 * (WhatsApp, Instagram…) açar; desteklenmiyorsa dosyayı indirir.
 * `hedef`: görüntüsü alınacak öğenin id'si.
 */
export default function KartPaylas({ hedef, dosyaAdi }: { hedef: string; dosyaAdi: string }) {
  const [bekle, setBekle] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function paylas() {
    const el = document.getElementById(hedef);
    if (!el) return;
    setHata(null);
    setBekle(true);
    try {
      const { toBlob } = await import("html-to-image");
      await document.fonts?.ready;
      const blob = await toBlob(el, { pixelRatio: 3, cacheBust: true });
      if (!blob) throw new Error("görsel üretilemedi");
      const dosya = new File([blob], `${dosyaAdi}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [dosya] })) {
        await navigator.share({ files: [dosya], title: "Sezon kartı" });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = dosya.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setHata("Görsel hazırlanamadı. Yazdır / PDF seçeneğini deneyin.");
    } finally {
      setBekle(false);
    }
  }

  return (
    <div className="print:hidden">
      <button type="button" onClick={paylas} disabled={bekle} className="btn-birincil w-full">
        {bekle ? "Görsel hazırlanıyor…" : "Görsel olarak paylaş / indir"}
      </button>
      {hata ? <p className="mt-2 text-center text-xs text-red-700">{hata}</p> : null}
    </div>
  );
}
