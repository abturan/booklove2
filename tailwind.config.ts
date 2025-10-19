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
        primary: '#db3d3a',
        blush: {
          50: '#fff1f5',
          100: '#ffe4ec',
          500: '#ff6482',
          600: '#e74b6b'
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
