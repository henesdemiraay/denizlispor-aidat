import type { MetadataRoute } from "next";

/** Uygulama kişisel veri içerir: arama motorlarına yalnızca ürün tanıtım sayfası açık. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/urun"], disallow: ["/"] }],
  };
}
