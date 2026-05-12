import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'ELYON — Inteligência de Marketing com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      <html lang="pt-BR">
        <body style={{ background: 'white', color: 'black', margin: 0, padding: 0 }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
