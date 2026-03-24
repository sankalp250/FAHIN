/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Sora'", "sans-serif"],
      },
      colors: {
        bg: "#EEF0F5",
        surface: "#F8F9FC",
        accent: { DEFAULT: "#F59E0B", light: "#FDE68A", dark: "#D97706" },
        danger: "#EF4444",
        safe: "#10B981",
        warn: "#F97316",
        muted: "#94A3B8",
        ink: "#1E293B",
        "ink-soft": "#64748B",
      },
      boxShadow: {
        neu: "6px 6px 12px #d1d4dc, -6px -6px 12px #ffffff",
        "neu-inset": "inset 4px 4px 8px #d1d4dc, inset -4px -4px 8px #ffffff",
        "neu-sm": "3px 3px 7px #d1d4dc, -3px -3px 7px #ffffff",
        glass: "0 8px 32px rgba(31, 38, 135, 0.10)",
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem", "4xl": "2rem" },
      backdropBlur: { glass: "20px" },
    },
  },
  plugins: [],
}
