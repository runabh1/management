/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b'
        },
        brand: {
          purple: '#6366f1',
          violet: '#8b5cf6',
          indigo: '#4f46e5',
          pink:   '#ec4899',
          cyan:   '#06b6d4'
        }
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-in':  'bounceIn 0.5s ease-out',
        'shimmer':    'shimmer 2s infinite'
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:  { from: { transform: 'translateX(-20px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        slideUp:  { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        bounceIn: { '0%': { transform: 'scale(0.9)', opacity: 0 }, '50%': { transform: 'scale(1.02)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(99,102,241,0.3)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.3)',
        'card':        '0 1px 3px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.05)',
        'card-hover':  '0 4px 16px rgba(0,0,0,0.12), 0 8px 40px rgba(0,0,0,0.08)'
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary':  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-secondary':'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)'
      }
    }
  },
  plugins: []
}
