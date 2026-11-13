'use client'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import {
  metricValue,
  reportedMetric,
  ratio,
  sourceLabel,
  crmMetricValue,
  crmIntakeMetric,
  type PerformanceSource,
} from '@/lib/performance/model'
import { count, money, percent, SectionTitle, Notice } from './shared'
export default function Funnel({
  sources,
  report,
  onContacts,
}: {
  sources: PerformanceSource[]
  report: any
  onContacts: () => void
}) {
  const crm = (key: string) => crmMetricValue(report, key),
    intake = crmIntakeMetric(report)
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Do investimento ao resultado, com as etapas observadas"
        detail="O funil mostra o que cada fonte mediu. Eventos de anúncios e negócios no CRM não são tratados como uma sequência de pessoas identificadas."
      />
      {sources
        .filter((s) => s.success)
        .map((source) => {
          const value = (key: string) =>
            metricValue(source, key) ??
            reportedMetric(report, source.platform, key, source.accountId)
              ?.value ??
            null
          const outcomes =
            source.platform === 'meta'
              ? [
                  ['Conversas iniciadas', 'messages_started'],
                  ['Novos contatos por mensagem', 'new_message_contacts'],
                  ['Formulários Meta', 'meta_form_leads'],
                  ['Leads no site', 'website_leads'],
                  ['Cadastros concluídos', 'website_registrations'],
                  ['Compras atribuídas', 'purchases'],
                ]
              : [
                  ['Conversões principais', 'google_conversions'],
                  ['Formulários enviados', 'google_forms'],
                  ['Ações de contato', 'google_contact_events'],
                  ['Cadastros', 'google_signups'],
                  ['Leads qualificados', 'google_qualified_leads'],
                  ['Compras atribuídas', 'purchases'],
                ]
          return (
            <Card key={source.platform}>
              <SectionTitle
                title={sourceLabel(source.platform)}
                detail={`Conta ${source.accountId} · eventos atribuídos pela própria plataforma`}
                action={<Badge tone="blue">Aquisição e intenção</Badge>}
              />
              <div className="grid sm:grid-cols-3 gap-3">
                <Stage
                  index="01"
                  title="Investimento"
                  value={money(source.totals?.spend)}
                  detail="Verba efetivamente registrada no período"
                />
                <Stage
                  index="02"
                  title="Impressões"
                  value={count(source.totals?.impressions)}
                  detail="Exibições; uma pessoa pode aparecer mais de uma vez"
                />
                <Stage
                  index="03"
                  title="Cliques"
                  value={count(source.totals?.clicks)}
                  detail={`CTR ${percent(ratio(source.totals?.clicks, source.totals?.impressions))} · cliques ÷ impressões`}
                />
              </div>
              <div className="mt-5 border-t border-line pt-5">
                <h3 className="font-semibold text-sm text-ink">
                  Ações registradas depois da exposição aos anúncios
                </h3>
                <p className="text-xs text-ink-2 mt-2 mb-4">
                  São saídas diferentes da jornada. Elas podem se sobrepor e não
                  devem ser somadas como contatos únicos ou usadas para calcular
                  abandono entre etapas.
                </p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {outcomes.map(([label, key]) => (
                    <div
                      key={key}
                      className="border border-line rounded-lg p-4"
                    >
                      <p className="text-xs text-ink-2">{label}</p>
                      <p className="text-2xl font-semibold text-ink mt-1">
                        {count(value(key))}
                      </p>
                      <p className="text-xs text-ink-2 mt-2">
                        {value(key) === null
                          ? 'Evento não informado neste recorte'
                          : `Custo por evento: ${money(ratio(source.totals?.spend, value(key)))}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {source.platform === 'meta' && (
                <div className="mt-4 text-xs text-ink-2">
                  Visualizações da página: {count(value('landing_page_views'))}.
                  Se o destino é um site e há cliques sem esse evento, verifique
                  carregamento e rastreamento. Campanhas de WhatsApp podem não
                  passar por uma página do site.
                </div>
              )}
            </Card>
          )
        })}
      <div className="rounded-xl border border-dashed border-line bg-canvas-2 p-5">
        <div className="flex justify-between gap-4 flex-wrap">
          <div>
            <Badge tone="neutral">04 · Resultado comercial</Badge>
            <h2 className="font-semibold text-lg text-ink mt-3">
              O que aconteceu no atendimento e nas vendas?
            </h2>
            <p className="text-sm text-ink-2 mt-2 max-w-3xl">
              O CRM completa a leitura. Os negócios seguem o critério de período
              da fonte e podem ter começado em datas diferentes. Sem associação
              dos contatos, a taxa de fechamento dos anúncios não é calculada.
            </p>
          </div>
          <Button size="sm" variant="soft" onClick={onContacts}>
            Conferir contatos e vendas →
          </Button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          {[
            [intake.label, count(intake.value)],
            ['Negócios ganhos', count(crm('crm_won_leads'))],
            ['Valor dos negócios ganhos', money(crm('crm_won_value'))],
          ].map(([label, value]) => (
            <div
              key={label}
              className="bg-paper border border-line rounded-lg p-4"
            >
              <p className="text-xs text-ink-2">{label}</p>
              <p className="text-2xl font-semibold text-ink mt-2">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <Notice>
        {crm('crm_won_leads') === null
          ? 'Próximo ponto de medição: disponibilizar os dados comerciais do CRM no mesmo recorte e associar contatos à origem. Até lá, não há base para calcular CAC de cliente ou conversão final em venda.'
          : 'Para estudar a perda entre etapas, associe cada negócio à origem e acompanhe uma mesma safra de contatos. A comparação entre totais do período sozinha não mede abandono.'}
      </Notice>
    </div>
  )
}
function Stage({
  index,
  title,
  value,
  detail,
}: {
  index: string
  title: string
  value: string
  detail: string
}) {
  return (
    <div className="bg-canvas-2 rounded-lg p-4">
      <p className="text-xs font-mono text-blue">
        {index} · {title}
      </p>
      <p className="text-2xl font-semibold text-ink mt-2">{value}</p>
      <p className="text-xs text-ink-2 mt-2">{detail}</p>
    </div>
  )
}
