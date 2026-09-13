import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sohne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Signifier', 'ui-serif', 'Georgia', 'serif'],
        geist: ['var(--font-geist-sans)', 'sans-serif'],
      },
      colors: {
        'brand-violet': '#7c3aed',
        'brand-violet-light': '#a78bfa',
        'ink-black': 'var(--color-ink-black)',
        'paper-white': 'var(--color-paper-white)',
        'mist-gray': 'var(--color-mist-gray)',
        'fog-white': 'var(--color-fog-white)',
        'slate-gray': 'var(--color-slate-gray)',
        'ash-gray': 'var(--color-ash-gray)',
        'smoke-gray': 'var(--color-smoke-gray)',
        'blush-peach': 'var(--color-blush-peach)',
        'sienna-brown': 'var(--color-sienna-brown)',
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "var(--color-paper-white)",
        foreground: "var(--color-ink-black)",
        primary: {
          DEFAULT: "var(--color-ink-black)",
          foreground: "var(--color-paper-white)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "var(--color-mist-gray)",
          foreground: "var(--color-slate-gray)",
        },
        accent: {
          DEFAULT: "var(--color-blush-peach)",
          foreground: "var(--color-sienna-brown)",
        },
        popover: {
          DEFAULT: "var(--color-paper-white)",
          foreground: "var(--color-ink-black)",
        },
        card: {
          DEFAULT: "var(--color-mist-gray)",
          foreground: "var(--color-ink-black)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'subtle': '0 0 0 1px rgba(0,0,0,0.05), 0 4px 24px 0 rgba(0,0,0,0.08)',
        'subtle-2': '0 0 0 1px rgba(0,0,0,0.05), 0 8px 40px 0 rgba(0,0,0,0.1)',
        'subtle-3': '0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
};
export default config;
