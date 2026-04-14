// app/sign-in/[[...sign-in]]/page.tsx — Tela de login com tema ELYON
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center px-4">
      {/* Logo acima do card */}
      <div className="mb-8 text-center">
        <div
          className="font-display font-bold text-4xl mb-2"
          style={{
            background: 'linear-gradient(135deg, #F0B429, #FFD166)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ELYON
        </div>
        <p className="text-slate-500 text-sm">Inteligência de marketing com IA</p>
      </div>

      {/* Componente Clerk com tema escuro ELYON */}
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#F0B429',
            colorBackground: '#111114',
            colorText: '#E2E8F0',
            colorTextSecondary: '#94A3B8',
            colorInputBackground: '#16161A',
            colorInputText: '#E2E8F0',
            colorNeutral: '#2A2A30',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
          },
          elements: {
            card: 'shadow-card bg-[#111114] border border-[#2A2A30] rounded-2xl',
            headerTitle: 'text-white font-display font-bold',
            headerSubtitle: 'text-slate-500',
            formButtonPrimary:
              'bg-[#F0B429] hover:bg-[#FFD166] text-black font-bold rounded-xl transition-colors',
            formFieldInput:
              'bg-[#16161A] border-[#2A2A30] text-slate-200 rounded-xl focus:border-[#F0B429]',
            footerActionLink: 'text-[#F0B429] hover:text-[#FFD166]',
            dividerLine: 'bg-[#2A2A30]',
            dividerText: 'text-slate-600',
            socialButtonsBlockButton:
              'bg-[#16161A] border-[#2A2A30] text-slate-300 hover:bg-[#1E1E24] rounded-xl',
          },
        }}
      />
    </div>
  )
}
