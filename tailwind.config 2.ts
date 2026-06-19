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
        // Surfaces (CLARITY: warm-neutral)
        canvas: {
          DEFAULT: '#F4F4F2',
          2: '#ECECE8',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          2: '#FAFAF8',
        },
        // Dark "command center" surface (hero / action moments)
        'ink-surface': {
          DEFAULT: '#181A20',
          2: '#20232B',
          line: '#2C2F38',
        },
        'on-ink': {
          DEFAULT: '#F4F5F7',
          2: '#A6ABB8',
          3: '#6E7480',
        },
        // Text (ink)
        ink: {
          DEFAULT: '#18191D',
          2: '#565862',
          3: '#898C97',
          4: '#B0B3BC',
        },
        // Lines
        line: {
          DEFAULT: '#E6E5E0',
          2: '#EFEFEB',
          strong: '#D5D4CD',
        },
        // Accents (NO PURPLE)
        blue: {
          DEFAULT: '#2B5BE3',
          500: '#5485FF',
          600: '#1E47C4',
          soft: '#EBF0FE',
          line: '#CCDAFB',
        },
        green: {
          DEFAULT: '#0E9E6E',
          500: '#16B981',
          600: '#0B855D',
          soft: '#E3F6EE',
          line: '#B7E6D1',
        },
        // Status
        red: {
          DEFAULT: '#E1483F',
          soft: '#FCEBE9',
        },
        amber: {
          DEFAULT: '#D9870B',
          soft: '#FBF0D9',
        },
        teal: '#0E9CB0',
        slate: '#64748B',
        // Data viz categorical
        dv: {
          1: '#2B5BE3',
          2: '#0E9E6E',
          3: '#0E9CB0',
          4: '#D9870B',
          5: '#E1483F',
          6: '#6E7480',
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
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '22px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,25,29,.04), 0 1px 2px rgba(24,25,29,.04)',
        'card-hover': '0 1px 3px rgba(24,25,29,.05), 0 8px 20px -8px rgba(24,25,29,.10)',
        highlight: '0 6px 20px -8px rgba(24,25,29,.14), 0 24px 56px -20px rgba(24,25,29,.16)',
        pop: '0 8px 36px -8px rgba(24,25,29,.20)',
        ink: '0 8px 28px -10px rgba(24,26,32,.45), 0 2px 8px rgba(24,26,32,.20)',
      },
      backgroundImage: {
        'blue-gradient': 'linear-gradient(135deg, #2B5BE3 0%, #0E9CB0 100%)',
        'canvas-gradient': 'linear-gradient(160deg, #F4F4F2 0%, #ECECE8 100%)',
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
