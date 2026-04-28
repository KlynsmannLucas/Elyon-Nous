// app/not-found.tsx — Página 404 customizada
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0B', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{
          fontSize: '72px', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #F5A500, #FFD166)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>404</div>
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>
          Página não encontrada
        </h1>
        <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6, margin: '0 0 32px' }}>
          O link que você acessou não existe ou foi removido.
        </p>
        <Link href="/dashboard" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #F5A500, #FFD166)',
          color: '#000', fontWeight: 700, fontSize: '15px',
          padding: '14px 32px', borderRadius: '14px', textDecoration: 'none',
        }}>
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}
