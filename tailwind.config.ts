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
        background: "#0A0A0A",
        surface: "#111111",
        card: "#1A1A1A",
        "card-hover": "#222222",
        border: "#2A2A2A",
        "border-strong": "#3A3A3A",
        gold: "#C9A84C",
        "gold-dark": "#9A7A30",
        "gold-light": "#E2C06A",
        "gold-muted": "rgba(201,168,76,0.12)",
        "text-primary": "#F5F0E8",
        "text-secondary": "#A89880",
        "text-muted": "#5C5548",
        success: "#7CB87A",
        warning: "#E8A838",
        danger: "#E06B6B",
        info: "#7BB8D4",
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #9A7A30, #E2C06A)",
      },
    },
  },
  plugins: [],
};
export default config;
