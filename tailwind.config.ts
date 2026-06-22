import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:    "#FAF8F5",
        surface:       "#F0EBE3",
        card:          "#FFFFFF",
        "card-hover":  "#F5F2EE",
        border:        "#E8E0D8",
        "border-strong": "#D4C9BC",
        bordeaux:      "#6B3A4B",
        "bordeaux-dark":  "#562E3C",
        "bordeaux-light": "#7D4558",
        "bordeaux-muted": "rgba(107,58,75,0.10)",
        // gold aliases → bordeaux so existing classes keep working
        gold:          "#6B3A4B",
        "gold-dark":   "#562E3C",
        "gold-light":  "#7D4558",
        "gold-muted":  "rgba(107,58,75,0.10)",
        "text-primary":   "#2C2420",
        "text-secondary": "#8B7355",
        "text-muted":     "#B09880",
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
