import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

// Marka renkleri: yeşil #00A650, siyah #231F20, beyaz #FFFFFF.
// Kulüp değişince yalnızca bu dosyadaki "yesil" ölçeği ve "siyah" değişir (beyaz etiket).
// Kural: marka yeşili (500) zemininde yazı her zaman siyah; beyaz yazı yeşilde okunmuyor.
// 600 ve üstü, koyu zeminde okunan açık yeşil metin tonlarıdır (türetilmiş).
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Koyu tema (prototip "Yuva"): zemin marka siyahı, kartlar bir ton açık.
        // neutral ölçeği bilerek TERS: 900 = en açık metin (beyaz), 50 = en koyu yüzey.
        // Böylece mevcut "text-neutral-900 / bg-neutral-100" sınıfları koyu zeminde doğru okunur.
        yesil: {
          50: "#16271E", 100: "#1D3426", 200: "#245035",
          300: "#66CC94", 400: "#2BB86B", 500: "#00A650",
          600: "#2BB86B", 700: "#33C06F", 800: "#66CC94", 900: "#A3E0BE",
        },
        siyah: "#231F20",
        yuzey: "#2D292A",
        zemin: "#231F20",
        neutral: {
          50: "#2D292A", 100: "#353031", 200: "#3E393A", 300: "#4D4748",
          400: "#857E7F", 500: "#ABA5A6", 600: "#C9C4C5", 700: "#DAD6D6",
          800: "#EEECEC", 900: "#FFFFFF", 950: "#FFFFFF",
        },
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
