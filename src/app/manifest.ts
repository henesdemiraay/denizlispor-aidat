import type { MetadataRoute } from "next";
import { KULUP } from "@/kulup";

/** PWA manifesti — kulüp yapılandırmasından üretilir (/manifest.webmanifest). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${KULUP.kisaAd} Sporcu Takip`,
    short_name: KULUP.kisaAd,
    description: `${KULUP.ad} sporcu takip uygulaması — antrenman, gelişim, aidat`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: KULUP.renkler.koyu,
    theme_color: KULUP.renkler.koyu,
    lang: "tr",
    dir: "ltr",
    icons: [
      { src: KULUP.arma, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "384x384", type: "image/png", purpose: "maskable" },
    ],
  };
}
