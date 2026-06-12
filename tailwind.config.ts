import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2e8cf0",
          cyan: "#18d5e8",
          ink: "#111827"
        }
      }
    }
  },
  plugins: []
};

export default config;
