import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Back Market "Revolve" design system: BM Duplet typeface (TXT for body,
      // DSP for display/headings), with Helvetica fallbacks matching the DS
      // metric overrides. Served from BM's public statics CDN.
      fontFamily: {
        sans: [
          "BMDupletTXT",
          "HelveticaTXT",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "BMDupletDSP",
          "HelveticaDSP",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Authoritative Revolve brand tokens (sourced from @backmarket/design-tokens).
        brand: {
          DEFAULT: "hsl(268, 74%, 65%)", // mid-purple-55 — primary brand purple
          hover: "hsl(268, 74%, 58%)",
          dark: "hsl(279, 59%, 14%)", // dark-violet-10
        },
        emerald: {
          brand: "hsl(149, 65%, 60%)", // mid-emerald-79 — brand green / success
        },
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "toast-in": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "toast-in": "toast-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
