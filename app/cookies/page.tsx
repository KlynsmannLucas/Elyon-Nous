import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Política de Cookies — Elyon' }

export default function CookiesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '60px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '40px' }}>← Voltar</Link>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, background: 'linear-gradient(135deg,#F5A500,#FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>ELYON</div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>Política de Cookies</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Última atualização: abril de 2025</p>
        </div>

        <div style={{ background: '#111114', border: '1px solid #2A2A30', borderRadius: '20px', padding: '40px' }}>
          {[
            { tipo: 'Essenciais', cor: '#22C55E', desc: 'Necessários para o funcionamento da plataforma. Sem eles, recursos como autenticação e sessão não funcionam.', exemplos: ['Sessão de autenticação (Clerk)', 'CSRF protection (oauth_csrf)', 'Preferências do dashboard'] },
            { tipo: 'Analytics', cor: '#38BDF8', desc: 'Nos ajudam a entender como a plataforma é usada para melhorar a experiência. Não identificam você pessoalmente.', exemplos: ['Sentry (monitoramento de erros — só logs técnicos)', 'Vercel Analytics (métricas de performance)'] },
            { tipo: 'Marketing', cor: '#F5A500', desc: 'Utilizados para personalizar comunicações. Você pode optar por não receber e-mails de marketing a qualquer momento no perfil.', exemplos: ['Resend (e-mails transacionais e onboarding)'] },
          ].map(({ tipo, cor, desc, exemplos }) => (
            <div key={tipo} style={{ marginBottom: '28px', padding: '20px', background: '#16161A', borderRadius: '14px', border: `1px solid ${cor}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cor, display: 'inline-block' }} />
                <strong style={{ color: '#fff', fontSize: '15px' }}>{tipo}</strong>
              </div>
              <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.7, margin: '0 0 10px' }}>{desc}</p>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#64748B', fontSize: '13px' }}>
                {exemplos.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          ))}

          <div style={{ background: '#16161A', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
            <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Como gerenciar cookies</strong>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              Você pode desativar cookies nas configurações do seu navegador. Cookies essenciais não podem ser desativados pois são necessários para o funcionamento da plataforma. A desativação de cookies de analytics e marketing não afeta o acesso às funcionalidades.
            </p>
          </div>

          <div style={{ borderTop: '1px solid #2A2A30', paddingTop: '24px' }}>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Dúvidas: <a href="mailto:oi@elyonnous.com.br" style={{ color: '#F5A500' }}>oi@elyonnous.com.br</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
