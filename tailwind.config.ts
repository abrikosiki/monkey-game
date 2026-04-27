import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBg: "#1a1a2e",
        brandAccent: "#f4d03f",
      },
      fontFamily: {
        fredoka: ["'Fredoka One'", "cursive"],
        nunito: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
