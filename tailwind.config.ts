import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#faf6f0",
        foreground: "#3d3226",
        card: "#ffffff",
        "card-foreground": "#3d3226",
        popover: "#ffffff",
        "popover-foreground": "#3d3226",
        primary: { DEFAULT: "#c43a2f", foreground: "#fcf5f4" },
        secondary: { DEFAULT: "#ede4d5", foreground: "#3d3226" },
        muted: { DEFAULT: "#ede4d5", foreground: "#8c7b6e" },
        accent: { DEFAULT: "#4a9e6e", foreground: "#fcfcf9" },
        destructive: { DEFAULT: "#c43a2f", foreground: "#fcf5f4" },
        border: "#e8e0d5",
        input: "#e8e0d5",
        ring: "#c43a2f",
        cinnabar: "#c43a2f",
        jade: "#4a9e6e",
        gold: "#c49a3c",
        rice: "#faf6f0",
        ink: "#3d3226",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      fontFamily: {
        "serif-cn": ['"Noto Serif SC"', '"Songti SC"', '"STSong"', "serif"],
        "sans-cn": ['"Noto Sans SC"', '"PingFang SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -8px rgba(48, 32, 16, 0.15)",
        floating: "0 12px 40px -12px rgba(48, 32, 16, 0.22)",
      },
    },
  },
  plugins: [],
} satisfies Config;
