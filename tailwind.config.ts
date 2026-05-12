import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        "bg-2": "#131a36",
        card: "#1a2347",
        "card-2": "#222c5a",
        accent: "#ff4d6d",
        "accent-2": "#ffd23f",
        "accent-3": "#06d6a0",
        "accent-4": "#4cc9f0",
        border: "#2a3566",
        muted: "#9aa3c7",
      },
      animation: { pulse: "pulse 1.4s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
