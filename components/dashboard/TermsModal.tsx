'use client'
// Modal de aceite dos Termos de Uso e Política de Privacidade — exibido na primeira sessão
import { useState } from 'react'

interface Props {
  onAccept: () => void
}

export function TermsModal({ onAccept }: Props) {
  const [accepting, setAccepting] = useState(false)

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await fetch('/api/account/terms', { method: 'POST' })
    } finally {
      onAccept()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: '#111114', border: '1px solid #2A2A30', borderRadius: '24px',
        padding: '40px', maxWidth: '480px', width: '100%',
      }}>
        <div style={{
          fontSize: '22px', fontWeight: 900,
          background: 'linear-gradient(135deg, #F5A500, #FFD166)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '4px',
        }}>
          ELYON
        </div>

        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>
          Bem-vindo à plataforma
        </h2>
        <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
          Antes de começar, confirme que leu e concorda com os documentos abaixo, em conformidade com a LGPD (Lei 13.709/2018).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
          {[
            { label: 'Termos de Uso', href: '/termos' },
            { label: 'Política de Privacidade', href: '/privacidade' },
            { label: 'Política de Cookies', href: '/cookies' },
          ].map((doc) => (
            <a
              key={doc.href}
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: '#16161A',
                border: '1px solid #2A2A30', borderRadius: '12px',
                color: '#94A3B8', fontSize: '14px', textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(245,165,0,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A2A30')}
            >
              <span>{doc.label}</span>
              <span style={{ color: '#475569', fontSize: '12px' }}>Ler ↗</span>
            </a>
          ))}
        </div>

        <button
          onClick={handleAccept}
          disabled={accepting}
          style={{
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #F5A500, #FFD166)',
            border: 'none', borderRadius: '14px',
            color: '#000', fontSize: '15px', fontWeight: 800,
            cursor: accepting ? 'not-allowed' : 'pointer',
            opacity: accepting ? 0.7 : 1,
          }}
        >
          {accepting ? 'Confirmando...' : 'Li e aceito os documentos'}
        </button>

        <p style={{ color: '#374151', fontSize: '11px', textAlign: 'center', margin: '12px 0 0' }}>
          Ao continuar, você confirma que tem 18+ anos e autoriza o tratamento de dados conforme a LGPD.
        </p>
      </div>
    </div>
  )
}
