import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        forest: { DEFAULT: "#1a237e", deep: "#11185e", light: "#3949ab" },
        cream: { DEFAULT: "#fafafa", deep: "#f1f3f4" },
        clay: "#c62828",
        gold: "#ff9800",
        sage: "#4caf50",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["'Hanken Grotesk'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
