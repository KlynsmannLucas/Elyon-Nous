import type { Config } from 'tailwindcss'

// Configuração do Tailwind para o tema ELYON
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: {
          base: '#030305',
          card: '#0C0C12',
          elevated: '#111118',
        },
        // Bordas
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          subtle: 'rgba(255,255,255,0.04)',
          bright: 'rgba(255,255,255,0.1)',
        },
        // Gold — cor primária ELYON
        gold: {
          DEFAULT: '#F5A500',
          light: '#FFD166',
          dark: '#C98000',
          muted: 'rgba(245,165,0,0.12)',
        },
        // Status
        success: '#22C55E',
        danger: '#FF4D4D',
        purple: '#A78BFA',
        info: '#38BDF8',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F0B429 0%, #FFD166 100%)',
        'dark-gradient': 'linear-gradient(160deg, #030305 0%, #111114 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(240,180,41,0.06) 0%, rgba(167,139,250,0.03) 100%)',
      },
      boxShadow: {
        gold: '0 0 24px rgba(240,180,41,0.15)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)',
        glow: '0 0 40px rgba(240,180,41,0.08)',
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
