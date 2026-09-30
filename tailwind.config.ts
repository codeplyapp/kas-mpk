import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        blush: {
          DEFAULT: "#f4dbd8",
          50: "#fdf9f8",
          100: "#fbf3f2",
          200: "#f8e7e5",
          300: "#f4dbd8",
          400: "#eac3be",
          500: "#ddaba5",
          600: "#c78f88",
        },
        ash: {
          DEFAULT: "#bea8a7",
          50: "#f7f4f4",
          100: "#eee9e9",
          200: "#ded5d4",
          300: "#bea8a7",
          400: "#9e8584",
          500: "#7f6665",
          600: "#634d4c",
        },
        taupe: {
          DEFAULT: "#c09891",
          50: "#f9f4f3",
          100: "#f2e5e3",
          200: "#e4cac6",
          300: "#c09891",
          400: "#a87870",
          500: "#8e5b53",
          600: "#73463e",
          700: "#5a352e",
          800: "#422520",
          900: "#2d1714",
          950: "#1b0d0b",
        },
        brand: {
          bg: "#130e0e",
          surface: "#1a1313",
          card: "#231a1a",
          cardHover: "#2d2121",
          border: "#3d2d2c",
          borderLight: "#543e3c",
          blush: "#f4dbd8",
          ash: "#bea8a7",
          taupe: "#c09891",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
