import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import SwKayit from "@/components/SwKayit";
import KayitBildirimi from "@/components/KayitBildirimi";
import { KULUP, temaDegiskenleri } from "@/kulup";

export const metadata: Metadata = {
  metadataBase: new URL(KULUP.yayin.adres),
  title: { default: `${KULUP.kisaAd} Sporcu Takip`, template: `%s · ${KULUP.kisaAd}` },
  description: `${KULUP.ad} sporcuları için antrenman, gelişim ve aidat takip uygulaması`,
  manifest: "/manifest.webmanifest",
  applicationName: `${KULUP.kisaAd} Sporcu Takip`,
  appleWebApp: {
    capable: true,
    title: KULUP.kisaAd,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: KULUP.arma, sizes: "512x512", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: KULUP.renkler.koyu,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        {/* Beyaz etiket: kulübün renkleri kök değişkenlere yazılır */}
        <style dangerouslySetInnerHTML={{ __html: temaDegiskenleri() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Barlow:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Suspense fallback={null}>
          <KayitBildirimi />
        </Suspense>
        <SwKayit />
      </body>
    </html>
  );
}
