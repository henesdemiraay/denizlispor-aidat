/** @type {import('next').NextConfig} */

// Güvenlik başlıkları: tıklama korsanlığı, MIME tahmini ve gereksiz tarayıcı izinlerine karşı.
const GUVENLIK_BASLIKLARI = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: GUVENLIK_BASLIKLARI }];
  },
};
export default nextConfig;
