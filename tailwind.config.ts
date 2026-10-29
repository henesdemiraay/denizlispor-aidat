import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

// Marka renkleri: yeşil #00A650, siyah #231F20, beyaz #FFFFFF.
// Kulüp değişince yalnızca bu dosyadaki "yesil" ölçeği ve "siyah" değişir (beyaz etiket).
// Kural: marka yeşili (500) zemininde yazı her zaman siyah; beyaz yazı yeşilde okunmuyor.
// 600 ve üstü, beyaz zeminde metin ve beyaz yazılı dolgu için türetilmiş koyu tonlardır.
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        yesil: {
          50: "#EBF8F1", 100: "#D1F0DE", 200: "#A3E0BE",
          300: "#66CC94", 400: "#2BB86B", 500: "#00A650",
          600: "#007A3D", 700: "#00632F", 800: "#004D25", 900: "#00361A",
        },
        siyah: "#231F20",
        zemin: "#F4F3F3",
        neutral: {
          ...colors.neutral,
          800: "#2D292A",
          900: "#231F20",
        },
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
