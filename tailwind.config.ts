import type { Config } from 'tailwindcss'

// Configuração do Tailwind para o Redesign v2 — "terminal de dados premium" (light)
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: {
          DEFAULT: '#F4F5F7',
          2: '#EEF0F3',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          2: '#FBFCFD',
        },
        // Text (ink)
        ink: {
          DEFAULT: '#161B26',
          2: '#5A6473',
          3: '#8A93A3',
          4: '#AAB2BF',
        },
        // Lines
        line: {
          DEFAULT: '#E6E8EC',
          2: '#EEF0F3',
          strong: '#D7DAE0',
        },
        // Accents (NO PURPLE)
        blue: {
          DEFAULT: '#2C5FE0',
          600: '#1E4FD0',
          soft: '#EAF0FE',
          line: '#CBDBFB',
        },
        green: {
          DEFAULT: '#0E9E6E',
          600: '#0B855D',
          soft: '#E4F6EE',
          line: '#BBE7D3',
        },
        // Status
        red: {
          DEFAULT: '#E1483F',
          soft: '#FCEBEA',
        },
        amber: {
          DEFAULT: '#E08B0B',
          soft: '#FCF1DC',
        },
        teal: '#0E9CB0',
        slate: '#64748B',
        // Data viz categorical
        dv: {
          1: '#2C5FE0',
          2: '#0E9E6E',
          3: '#0E9CB0',
          4: '#E08B0B',
          5: '#E1483F',
          6: '#64748B',
        },
        // Legacy — removed purple, keep gold for backward compat
        gold: '#F5A500',
      },
      fontFamily: {
        sans: ['var(--font-schibsted)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        xs: '6px',
        sm: '9px',
        md: '13px',
        lg: '18px',
        xl: '24px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,28,46,.04), 0 1px 3px rgba(20,28,46,.05)',
        'card-hover': '0 2px 6px rgba(20,28,46,.05), 0 6px 18px rgba(20,28,46,.06)',
        highlight: '0 8px 24px rgba(20,28,46,.10), 0 24px 56px rgba(20,28,46,.10)',
        pop: '0 12px 40px rgba(20,28,46,.16)',
      },
      backgroundImage: {
        'blue-gradient': 'linear-gradient(135deg, #2C5FE0 0%, #0E9CB0 100%)',
        'canvas-gradient': 'linear-gradient(160deg, #F4F5F7 0%, #EEF0F3 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.4s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
