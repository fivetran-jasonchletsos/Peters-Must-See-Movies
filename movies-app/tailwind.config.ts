import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        paper: "#f5f1ea",
        cream: "#ebe5d8",
        accent: "#d94f3a",
        ember: "#b83420",
        muted: "#8b8478",
        slate: "#4a5568",
        umber: "#6b5744"
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Helvetica", "Arial", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
