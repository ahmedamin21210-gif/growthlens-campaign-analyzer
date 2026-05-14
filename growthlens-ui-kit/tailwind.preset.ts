import type { Config } from "tailwindcss";

const growthLensPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1E1B4B",
          cyan: "#06B6D4",
          green: "#22C55E",
          amber: "#F59E0B",
          red: "#EF4444",
          slate: "#0F172A",
          bg: "#F8FAFC",
          text: "#111827",
          muted: "#64748B",
          border: "#E2E8F0"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        brand: "18px",
        "brand-xl": "20px"
      },
      boxShadow: {
        executive: "0 20px 60px rgba(30, 27, 75, 0.10)",
        "brand-subtle": "0 12px 32px rgba(15, 23, 42, 0.08)"
      }
    }
  }
};

export default growthLensPreset;
