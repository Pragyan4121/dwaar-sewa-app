/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF5A3C",
          light: "#FF8265",
          dark: "#E1421F",
        },
        secondary: {
          DEFAULT: "#0F172A",
          light: "#334155",
        },
        accent: "#16A34A",
        warning: "#F59E0B",
        surface: "#FFFFFF",
        background: "#F8F7F5",
        muted: "#6B7280",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
