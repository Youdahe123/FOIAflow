import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  
  theme: {
    extend: {
      fontFamily: {
        serif:     ["'Playfair Display'", "Georgia", "serif"],
        garamond:  ["'EB Garamond'",     "Georgia", "serif"],
        sans:      ["'DM Sans'",          "system-ui", "sans-serif"],
      },
      colors: {
        newsprint: "#f4f4f2",
        ink:       "#1a1a1a",
        accent:    "#e31212",
        muted:     "#5a5a5a",
      },
      fontSize: {
        "headline-xl": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "headline-lg": ["2rem",    { lineHeight: "1.1",  letterSpacing: "-0.015em" }],
        "headline-md": ["1.375rem",{ lineHeight: "1.2",  letterSpacing: "-0.01em" }],
        "headline-sm": ["1.1rem",  { lineHeight: "1.25", letterSpacing: "-0.005em" }],
        "byline":      ["0.7rem",  { lineHeight: "1.4",  letterSpacing: "0.08em" }],
      },
    },
  },
  plugins: [],
};

export default config;