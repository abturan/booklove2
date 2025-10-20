// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#d74532',
        primaryRed: '#d74532',
        blush: {
          50: '#fff1f5',
          100: '#ffe4ec',
          500: '#ff6482',
          600: '#e74b6b'
        },
        rose: {
          50: '#fdecec',
          100: '#fad9d6',
          200: '#f6b6ae',
          300: '#f19286',
          400: '#ea6e5d',
          500: '#d74532',
          600: '#d74532',
          700: '#d74532',
          800: '#b13a2b',
          900: '#8c2f23'
        }
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0,0,0,0.08)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      }
    },
  },
  plugins: [],
} satisfies Config
