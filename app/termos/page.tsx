import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Termos de Uso — Elyon' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ color: '#F5A500', fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>{title}</h2>
      <div style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

export default function TermosPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '60px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '40px' }}>← Voltar</Link>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, background: 'linear-gradient(135deg,#F5A500,#FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>ELYON</div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>Termos de Uso</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Última atualização: abril de 2025</p>
        </div>

        <div style={{ background: '#111114', border: '1px solid #2A2A30', borderRadius: '20px', padding: '40px' }}>
          <Section title="1. Aceitação dos Termos">
            Ao acessar ou utilizar a plataforma Elyon Nous, você declara ter lido, compreendido e concordado com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não utilize a plataforma.
          </Section>

          <Section title="2. Descrição do Serviço">
            O Elyon é uma plataforma de inteligência estratégica para gestores de tráfego pago, agências e donos de negócio. Oferecemos diagnósticos de campanhas, estratégias geradas por inteligência artificial, benchmarks de mercado e ferramentas de análise de performance.
          </Section>

          <Section title="3. Sem Garantia de Resultados">
            <p style={{ margin: '0 0 12px' }}>O Elyon fornece análises e recomendações baseadas em dados e inteligência artificial, mas <strong style={{ color: '#fff' }}>não garante resultados financeiros, de vendas ou de performance de campanhas</strong>.</p>
            <p style={{ margin: 0 }}>Todas as decisões de investimento em mídia paga são de responsabilidade exclusiva do usuário. O Elyon não se responsabiliza por perdas decorrentes do uso das análises fornecidas.</p>
          </Section>

          <Section title="4. Responsabilidade do Usuário">
            <p style={{ margin: '0 0 8px' }}>Você é responsável por:</p>
            <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Garantir que os dados inseridos na plataforma foram coletados de forma legal</li>
              <li>Não utilizar a plataforma para fins ilícitos ou que violem direitos de terceiros</li>
              <li>Decisões tomadas com base nas análises e estratégias geradas</li>
            </ul>
          </Section>

          <Section title="5. Propriedade Intelectual">
            Todo o conteúdo da plataforma Elyon Nous — incluindo código, design, textos, algoritmos e modelos de análise — é de propriedade exclusiva da Elyon Nous. É proibida a reprodução, distribuição ou uso comercial sem autorização expressa.
          </Section>

          <Section title="6. Pagamentos e Assinatura">
            Os planos pagos são cobrados de forma recorrente via Stripe. O cancelamento pode ser feito a qualquer momento pelo portal de assinatura no perfil. Não há reembolso de períodos já cobrados, exceto nos casos previstos em lei.
          </Section>

          <Section title="7. Suspensão e Encerramento">
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, pratiquem abuso da plataforma ou utilizem técnicas automatizadas não autorizadas.
          </Section>

          <Section title="8. Modificações">
            Estes termos podem ser atualizados periodicamente. Mudanças significativas serão comunicadas por e-mail com pelo menos 15 dias de antecedência.
          </Section>

          <Section title="9. Foro">
            Fica eleito o foro da Comarca de São Paulo — SP para dirimir quaisquer controvérsias decorrentes destes termos, com renúncia a qualquer outro por mais privilegiado que seja.
          </Section>

          <div style={{ borderTop: '1px solid #2A2A30', paddingTop: '24px', marginTop: '8px' }}>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Dúvidas? Entre em contato: <a href="mailto:oi@elyonnous.com.br" style={{ color: '#F5A500' }}>oi@elyonnous.com.br</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
