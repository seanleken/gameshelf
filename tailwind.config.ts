import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        "bg-primary": "#0f1117",
        "bg-surface": "#161b26",
        "bg-surface-hover": "#1c2333",
        "bg-elevated": "#1e2536",
        // Text
        "text-primary": "#e2e5eb",
        "text-secondary": "#8b92a5",
        "text-tertiary": "#555d72",
        // Accent
        accent: "#e5a837",
        "accent-hover": "#ebb84f",
        "accent-muted": "rgba(229,168,55,0.15)",
        // Status colors
        status: {
          playing: "#22d3ee",    // cyan
          completed: "#4ade80",  // green
          backlog: "#fbbf24",    // amber
          dropped: "#f87171",    // red/rose
          wishlist: "#a78bfa",   // purple
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.07)",
      },
      maxWidth: {
        content: "1200px",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
