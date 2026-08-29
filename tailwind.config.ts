import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: {
          DEFAULT: "#07070a",
          surface: "#0d0d12",
          card: "#12121a",
          border: "#1e1e2d",
          hover: "#1a1a26",
        },
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        accent: {
          purple: "#8b5cf6",
          violet: "#a855f7",
          pink: "#ec4899",
          rose: "#f43f5e",
          amber: "#f59e0b",
          cyan: "#06b6d4",
          emerald: "#10b981",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'node-move-left': 'nodeMoveLeft 3s ease-in-out infinite alternate',
        'node-move-right': 'nodeMoveRight 3s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        nodeMoveLeft: {
          '0%': { transform: 'translateX(0px)' },
          '100%': { transform: 'translateX(60px)' },
        },
        nodeMoveRight: {
          '0%': { transform: 'translateX(0px)' },
          '100%': { transform: 'translateX(-60px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
