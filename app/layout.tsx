// DIAGNÓSTICO: layout mínimo sem ClerkProvider — remover após diagnóstico
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ELYON — Inteligência de Marketing com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: '#00FF00', color: 'black', margin: 0, padding: 0 }}>
        <div style={{ background: '#FF0', color: '#000', padding: '8px 16px', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
          LAYOUT MÍNIMO ATIVO — SEM CLERKPROVIDER
        </div>
        {children}
      </body>
    </html>
  )
}
