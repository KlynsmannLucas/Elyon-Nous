import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

// Redesign v2 — "terminal de dados premium" (light). Fonte de UI/títulos.
const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-schibsted',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ELYON — Inteligência de Marketing com IA',
  description:
    'Transforme dados em direção estratégica real para sua empresa. Análise de audiência, estratégia gerada por IA e performance em tempo real.',
  keywords: [
    'marketing digital',
    'inteligência artificial',
    'estratégia de marketing',
    'agência de marketing',
    'ROI marketing',
    'leads qualificados',
    'pequenas empresas Brasil',
  ],
  openGraph: {
    title: 'ELYON — Clareza para crescer. Inteligência para decidir.',
    description:
      'Plataforma de inteligência de marketing com IA para pequenas empresas brasileiras. Estratégia, audiência e performance num só lugar.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'ELYON',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="pt-BR" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
        <body className="bg-canvas text-ink font-body antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
