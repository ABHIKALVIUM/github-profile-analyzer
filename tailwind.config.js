/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'DM Serif Display'", "Georgia", "serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
        sans:    ["'DM Sans'", "system-ui", "sans-serif"],
      },
      colors: {
        ink:    "#0D0F12",
        slate:  "#1A1D23",
        panel:  "#21252D",
        border: "#2E333D",
        muted:  "#6B7280",
        accent: "#38BDF8",   // sky-400
        green:  "#4ADE80",
        amber:  "#FBBF24",
        coral:  "#F87171",
      },
      animation: {
        "fade-up":   "fadeUp 0.45s ease both",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1 },
          "50%":      { opacity: 0.3 },
        },
      },
    },
  },
  plugins: [],
};
