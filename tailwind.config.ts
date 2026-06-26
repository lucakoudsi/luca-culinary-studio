import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:    "var(--bg, #FAF8F5)",
        surface:       "var(--surface-2, #F4EFE9)",
        card:          "var(--surface, #FFFFFF)",
        "card-hover":  "var(--surface-2, #F4EFE9)",
        border:        "var(--border, #E8E0D8)",
        "border-strong": "var(--border, #D4C9BC)",
        bordeaux:      "var(--accent, #6B3A4B)",
        "bordeaux-dark":  "#562E3C",
        "bordeaux-light": "#7D4558",
        "bordeaux-muted": "rgba(107,58,75,0.10)",
        gold:          "var(--accent-gold, #C9A84C)",
        "gold-dark":   "#9B7A2A",
        "gold-light":  "#E8C67A",
        "gold-muted":  "rgba(201,168,76,0.10)",
        "text-primary":   "var(--text, #2C2420)",
        "text-secondary": "var(--text-muted, #9A8070)",
        "text-muted":     "var(--text-muted, #9A8070)",
        success:  "#5A9A58",
        warning:  "#C8882A",
        danger:   "#C05050",
        info:     "#5A9AB4",
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        body:    ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #562E3C, #7D4558)",
      },
    },
  },
  plugins: [],
};
export default config;
