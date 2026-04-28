import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'DPA — Data Processing Agreement — Elyon' }

export default function DPAPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '60px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#64748B', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '40px' }}>← Voltar</Link>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, background: 'linear-gradient(135deg,#F5A500,#FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>ELYON</div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 4px' }}>Data Processing Agreement</h1>
          <p style={{ color: '#F5A500', fontSize: '13px', fontWeight: 600, margin: '0 0 8px' }}>DPA — Acordo de Tratamento de Dados</p>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Conforme Lei 13.709/2018 (LGPD) · Última atualização: abril de 2025</p>
        </div>

        <div style={{ background: '#111114', border: '1px solid #2A2A30', borderRadius: '20px', padding: '40px' }}>

          <div style={{ background: 'rgba(245,165,0,0.06)', border: '1px solid rgba(245,165,0,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { papel: 'CONTROLADOR', entidade: 'O Cliente (usuário da plataforma Elyon)', cor: '#22C55E' },
                { papel: 'OPERADOR', entidade: 'Elyon Nous (plataforma)', cor: '#F5A500' },
              ].map(({ papel, entidade, cor }) => (
                <div key={papel} style={{ background: '#16161A', borderRadius: '10px', padding: '16px', border: `1px solid ${cor}25` }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: cor, letterSpacing: '0.1em', marginBottom: '6px' }}>{papel}</div>
                  <div style={{ color: '#fff', fontSize: '13px' }}>{entidade}</div>
                </div>
              ))}
            </div>
          </div>

          {[
            {
              num: '1', title: 'Objeto',
              body: 'Este DPA regula o tratamento de dados pessoais de terceiros (leads, clientes finais, personas) inseridos pelo Cliente na plataforma Elyon, conforme exigido pelo Art. 37 da LGPD.',
            },
            {
              num: '2', title: 'Papel das Partes',
              body: 'O Cliente é o Controlador: define a finalidade e os meios do tratamento. A Elyon Nous é a Operadora: realiza o tratamento exclusivamente conforme as instruções do Cliente e para a prestação do serviço contratado.',
            },
            {
              num: '3', title: 'Responsabilidade pela Coleta Legal',
              body: 'O Cliente declara e garante que todos os dados inseridos na plataforma foram coletados de forma legal, com base legal adequada (consentimento, contrato ou legítimo interesse), conforme exigido pela LGPD.',
            },
            {
              num: '4', title: 'Obrigações da Elyon Nous (Operadora)',
              body: null,
              lista: [
                'Tratar os dados somente conforme instruções documentadas do Cliente',
                'Não compartilhar os dados com terceiros além dos suboperadores necessários (Supabase, Anthropic, Vercel)',
                'Manter medidas técnicas e organizacionais de segurança adequadas (RLS, criptografia, rate limiting)',
                'Notificar o Cliente em até 72 horas em caso de incidente de segurança que afete seus dados',
                'Excluir ou devolver os dados ao término da relação contratual',
              ],
            },
            {
              num: '5', title: 'Suboperadores',
              body: 'A Elyon utiliza os seguintes suboperadores para a prestação do serviço, todos com adequação à LGPD/GDPR: Supabase (armazenamento), Anthropic (processamento de IA — sem retenção de prompts), Vercel (hospedagem), Sentry (monitoramento de erros).',
            },
            {
              num: '6', title: 'Notificação de Incidentes',
              body: 'Em caso de incidente de segurança envolvendo dados pessoais, a Elyon notificará o Cliente afetado por e-mail em até 72 horas, com descrição do incidente, dados afetados e medidas tomadas, conforme Art. 48 da LGPD.',
            },
            {
              num: '7', title: 'Vigência',
              body: 'Este DPA vigora enquanto o Cliente mantiver uma conta ativa na plataforma Elyon e é parte integrante dos Termos de Uso.',
            },
          ].map(({ num, title, body, lista }) => (
            <div key={num} style={{ marginBottom: '28px' }}>
              <h2 style={{ color: '#F5A500', fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>{num}. {title}</h2>
              {body && <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.8, margin: 0 }}>{body}</p>}
              {lista && (
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#94A3B8', fontSize: '14px', lineHeight: 2 }}>
                  {lista.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}

          <div style={{ borderTop: '1px solid #2A2A30', paddingTop: '24px' }}>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Contato DPO: <a href="mailto:oi@elyonnous.com.br" style={{ color: '#F5A500' }}>oi@elyonnous.com.br</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
