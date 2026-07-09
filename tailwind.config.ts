import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: 'var(--secondary)',
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: 'var(--accent)',
        border: 'var(--border)',
        destructive: 'var(--destructive)',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [],
} satisfies Config
