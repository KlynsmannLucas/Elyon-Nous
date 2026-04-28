import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Política de Privacidade — Elyon' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ color: '#F5A500', fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{title}</h2>
      <div style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '60px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '40px' }}>← Voltar</Link>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, background: 'linear-gradient(135deg,#F5A500,#FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>ELYON</div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>Política de Privacidade</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Última atualização: abril de 2025 · Conforme Lei 13.709/2018 (LGPD)</p>
        </div>

        <div style={{ background: '#111114', border: '1px solid #2A2A30', borderRadius: '20px', padding: '40px' }}>
          <Section title="1. Quem somos">
            Elyon Nous é uma plataforma de inteligência estratégica para tráfego pago. Somos Operadores dos dados que nossos clientes (Controladores) inserem na plataforma, conforme definido pela LGPD.
          </Section>

          <Section title="2. Dados que coletamos">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong style={{ color: '#fff' }}>Dados de conta:</strong> nome, e-mail e foto de perfil — coletados no cadastro via Clerk</li>
              <li><strong style={{ color: '#fff' }}>Dados de pagamento:</strong> histórico de assinatura e faturas — processados pelo Stripe (sem armazenar dados de cartão)</li>
              <li><strong style={{ color: '#fff' }}>Dados de clientes:</strong> informações que você insere sobre seus clientes (nome, nicho, orçamento, métricas de campanha)</li>
              <li><strong style={{ color: '#fff' }}>Dados de uso:</strong> logs de acesso e erros para monitoramento técnico via Sentry</li>
            </ul>
          </Section>

          <Section title="3. Como utilizamos os dados">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Gerar diagnósticos estratégicos e análises de performance via IA</li>
              <li>Fornecer benchmarks de mercado por nicho</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Melhorar a plataforma com base em logs técnicos (sem acesso ao conteúdo)</li>
              <li>Enviar comunicações essenciais sobre sua conta</li>
            </ul>
          </Section>

          <Section title="4. Base legal (LGPD Art. 7)">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong style={{ color: '#fff' }}>Execução de contrato:</strong> dados necessários para prestação do serviço</li>
              <li><strong style={{ color: '#fff' }}>Legítimo interesse:</strong> segurança, monitoramento de erros e melhoria da plataforma</li>
              <li><strong style={{ color: '#fff' }}>Consentimento:</strong> comunicações de marketing (você pode revogar a qualquer momento)</li>
            </ul>
          </Section>

          <Section title="5. O que não fazemos">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Não vendemos dados a terceiros</li>
              <li>Não armazenamos tokens OAuth de Meta Ads ou Google Ads (ficam apenas na sessão)</li>
              <li>Não armazenamos dados de cartão de crédito</li>
              <li>Não utilizamos dados de clientes para treinar modelos de IA</li>
            </ul>
          </Section>

          <Section title="6. Compartilhamento de dados">
            Compartilhamos dados apenas com prestadores essenciais: Clerk (autenticação), Stripe (pagamentos), Supabase (banco de dados), Anthropic (IA — sem retenção dos prompts), Sentry (monitoramento de erros) e Vercel (hospedagem). Todos com adequação à LGPD/GDPR.
          </Section>

          <Section title="7. Seus direitos (LGPD Art. 18)">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Acesso aos dados armazenados</li>
              <li>Correção de dados incompletos ou incorretos</li>
              <li>Exportação dos seus dados (disponível em Perfil → Privacidade)</li>
              <li>Exclusão completa da conta e todos os dados (disponível em Perfil → Privacidade)</li>
              <li>Revogação do consentimento a qualquer momento</li>
            </ul>
          </Section>

          <Section title="8. Retenção">
            Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são apagados permanentemente em até 30 dias dos sistemas de backup.
          </Section>

          <div style={{ borderTop: '1px solid #2A2A30', paddingTop: '24px', marginTop: '8px' }}>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Para exercer seus direitos: <a href="mailto:oi@elyonnous.com.br" style={{ color: '#F5A500' }}>oi@elyonnous.com.br</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
