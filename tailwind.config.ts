import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

// Beyaz etiket: renk değerleri burada YOK. Kulübün renkleri src/kulup yapılandırmasından
// kök CSS değişkenlerine yazılır; tailwind yalnızca değişken adlarını bilir.
// Kural: ana renk (500) zemininde yazı "anametin" (kulübün anaUzerindeMetin rengi).
const TONLAR = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
function ton(ad: string) {
  return Object.fromEntries(TONLAR.map((t) => [t, `rgb(var(--${ad}-${t}) / <alpha-value>)`]));
}

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Koyu tema (prototip "Yuva"): zemin marka siyahı, kartlar bir ton açık.
        // neutral ölçeği bilerek TERS: 900 = en açık metin (beyaz), 50 = en koyu yüzey.
        // Böylece mevcut "text-neutral-900 / bg-neutral-100" sınıfları koyu zeminde doğru okunur.
        // Tüm marka renkleri CSS değişkeninden gelir (src/kulup → kök stil).
        // Sınıf adları geçmişten "yesil"; kulübün ana rengi neyse odur.
        yesil: ton("marka"),
        siyah: "rgb(var(--koyu) / <alpha-value>)",
        yuzey: "rgb(var(--yuzey) / <alpha-value>)",
        zemin: "rgb(var(--koyu) / <alpha-value>)",
        anametin: "rgb(var(--ana-metin) / <alpha-value>)",
        neutral: { ...ton("notr"), 950: "rgb(var(--notr-900) / <alpha-value>)" },
        red: { ...colors.red, 50: "#2E1512", 100: "#3F1B16", 200: "#5A241C", 700: "#F08B7A", 800: "#F4A193", 900: "#F8B9AE" },
        amber: { ...colors.amber, 50: "#2A220B", 100: "#3A2E0E", 200: "#55431A", 700: "#E9C060", 800: "#EFCD80", 900: "#F5DCA3" },
        emerald: { ...colors.emerald, 50: "#10291D", 100: "#163726", 200: "#1F4A33", 700: "#4FC384", 800: "#7DD3A3", 900: "#A3E0BE" },
        sky: { ...colors.sky, 50: "#111D2E", 100: "#15233A", 200: "#1E3352", 700: "#8DB4E8", 800: "#A6C6EE", 900: "#C2D8F3" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        manset: ["var(--font-manset)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
