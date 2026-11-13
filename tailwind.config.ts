import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080B14",
        panel: "#101624",
        card: "#161D2E",
        accent: "#8B5CF6",
        accent2: "#06B6D4",
        primary: "#F8FAFC",
        muted: "#94A3B8",
        border: "#1E293B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
