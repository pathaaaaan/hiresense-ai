import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0F14", // near-black ground, cooler than pure black
          raised: "#121821", // card surface
          overlay: "#1A222D", // hover/overlay surface
          border: "#232C38",
        },
        signal: {
          // teal-cyan "sensor" accent — the app's read on you
          DEFAULT: "#14E8C4",
          dim: "#0EA894",
          soft: "#0D2A26",
        },
        amber: {
          DEFAULT: "#FFB020",
          soft: "#2E2312",
        },
        ink: {
          DEFAULT: "#EDF2F7",
          muted: "#8A97A8",
          faint: "#57626F",
        },
        danger: "#FF5C6C",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(20,232,196,0.06), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(20,232,196,0.35)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        sweep: "sweep 3.5s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
