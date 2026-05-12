import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

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
        <body className="bg-[#0A0A0B] text-slate-200 font-body antialiased">
          <script dangerouslySetInnerHTML={{ __html: `
            window.addEventListener('error', function(e) {
              var d = document.createElement('div');
              d.style = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:16px;z-index:99999;font-size:13px;white-space:pre-wrap;font-family:monospace';
              d.textContent = 'JS ERROR: ' + e.message + '\\n' + (e.filename||'') + ':' + e.lineno;
              document.body.appendChild(d);
            });
            window.addEventListener('unhandledrejection', function(e) {
              var d = document.createElement('div');
              d.style = 'position:fixed;top:0;left:0;right:0;background:orange;color:black;padding:16px;z-index:99999;font-size:13px;white-space:pre-wrap;font-family:monospace';
              d.textContent = 'PROMISE ERROR: ' + e.reason;
              document.body.appendChild(d);
            });
          ` }} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
