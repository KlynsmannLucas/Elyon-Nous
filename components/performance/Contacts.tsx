'use client'
import { useState } from 'react'
import { Card, Badge, Button } from '@/components/dashboard/v2'
import InternalSettingsLink from '@/components/dashboard/InternalSettingsLink'
import {
  compareObservedMetrics,
  nativeObservedMetrics,
  normalizeAccountId,
} from '@/lib/reportei-metrics'
import {
  metricValue,
  reportedMetric,
  sourceLabel,
  crmMetricValue,
  crmIntakeMetric,
  type PerformanceSource,
} from '@/lib/performance/model'
import {
  MetricCard,
  Notice,
  SectionTitle,
  Pending,
  count,
  money,
  day,
  timestamp,
  DataTable,
} from './shared'
export default function Contacts({
  sources,
  report,
  loading,
  error,
  onHistory,
}: {
  sources: PerformanceSource[]
  report: any
  loading: boolean
  error: string
  onHistory: (period: { startDate: string; endDate: string }) => void
}) {
  const [details, setDetails] = useState(false),
    meta = sources.find((s) => s.platform === 'meta'),
    google = sources.find((s) => s.platform === 'google')
  const read = (key: string) => {
    const native = metricValue(meta, key)
    const other = reportedMetric(report, 'meta', key, meta?.accountId)
    return {
      value: native ?? other?.value ?? null,
      source:
        native !== null
          ? 'Meta · conexão direta'
          : other
            ? 'Meta · via Reportei'
            : 'Leitura indisponível',
    }
  }
  const contacts = read('new_message_contacts'),
    conversations = read('messages_started'),
    registrations = read('website_registrations'),
    forms = read('meta_form_leads')
  const crmSources = (report?.sources || []).filter(
    (s: any) => s.platform === 'kommo',
  )
  const crm = (key: string) => crmMetricValue(report, key),
    intake = crmIntakeMetric(report)
  const groups: any[] = sources.map((source) => ({
    platform: source.platform,
    accountId: source.accountId,
    direct: source,
    other: null,
  }))
  for (const other of report?.sources || []) {
    const match = groups.find(
      (g) =>
        !g.other &&
        g.platform === other.platform &&
        normalizeAccountId(other.platform, g.accountId) ===
          normalizeAccountId(other.platform, other.accountId),
    )
    if (match) match.other = other
    else
      groups.push({
        platform: other.platform,
        accountId: other.accountId,
        other,
      })
  }
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Dos anúncios ao resultado comercial"
        detail="Novos contatos, conversas, cadastros e vendas têm significados diferentes. Cada número mantém sua origem e o período da consulta."
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Novos contatos por mensagem"
          value={count(contacts.value)}
          note={`${contacts.source}. Estimativa de primeiras mensagens atribuídas aos anúncios; não é o total de pessoas no CRM.`}
        />
        <MetricCard
          label="Conversas iniciadas"
          value={count(conversations.value)}
          note={`${conversations.source}. Inclui retomadas após 7 dias; não somar aos novos contatos.`}
        />
        <MetricCard
          label="Formulários nas tecnologias Meta"
          value={count(forms.value)}
          note={`${forms.source}. Eventos de lead nas tecnologias Meta; não representam todos os contatos.`}
        />
        <MetricCard
          label="Cadastros concluídos no site"
          value={count(registrations.value)}
          note={`${registrations.source}. Evento de cadastro do rastreamento; separado de mensagens e formulários.`}
        />
      </div>
      {google && (
        <Card>
          <SectionTitle
            title="O que o Google registrou"
            detail="Conversões são ações configuradas na conta. Podem incluir contatos, formulários, ligações e outras ações; não representam automaticamente clientes únicos."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['google_conversions', 'Conversões principais'],
              ['google_forms', 'Formulários enviados'],
              ['google_contact_events', 'Ações de contato'],
              ['google_signups', 'Cadastros'],
            ].map(([key, label]) => (
              <div key={key} className="border-l-2 border-line pl-4">
                <p className="text-xs text-ink-2">{label}</p>
                <p className="text-2xl font-semibold text-ink mt-1">
                  {count(
                    metricValue(google, key) ??
                      reportedMetric(report, 'google', key, google.accountId)
                        ?.value ??
                      null,
                  )}
                </p>
                <p className="text-xs text-ink-2 mt-1">
                  {metricValue(google, key) !== null
                    ? 'Conexão direta'
                    : reportedMetric(report, 'google', key, google.accountId)
                      ? 'Via Reportei'
                      : 'Não informado neste recorte'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <SectionTitle
          title="Atendimento e vendas no CRM"
          detail="O CRM informa negócios segundo o critério de período da fonte. Um negócio pode ter começado antes dessas datas. Sem associação por contato, não é possível atribuir cada venda a um anúncio."
          action={
            <Badge tone={crm('crm_won_leads') !== null ? 'good' : 'warn'}>
              {crm('crm_won_leads') !== null
                ? 'Com dados comerciais'
                : 'Leitura comercial pendente'}
            </Badge>
          }
        />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ['intake', intake.label],
            ['crm_won_leads', 'Negócios ganhos'],
            ['crm_won_value', 'Valor dos negócios ganhos'],
            ['crm_lost_leads', 'Negócios perdidos'],
          ].map(([key, label]) => (
            <div key={key}>
              <p className="text-xs text-ink-2">{label}</p>
              <p className="text-2xl text-ink font-semibold mt-1">
                {key === 'intake'
                  ? count(intake.value)
                  : key === 'crm_won_value'
                    ? money(crm(key))
                    : count(crm(key))}
              </p>
            </div>
          ))}
        </div>
        {crm('crm_won_leads') === null && (
          <p className="text-sm text-ink-2 mt-5">
            As contas de anúncios informam eventos de marketing. A quantidade de
            vendas confirmadas depende da leitura do CRM neste mesmo período;
            ausência de dado não significa zero vendas.
          </p>
        )}
        {crmSources.length > 1 && (
          <p className="text-xs text-ink-2 mt-3">
            Há várias integrações comerciais. Consulte cada uma nas leituras por
            fonte para evitar somar negócios duplicados.
          </p>
        )}
      </Card>
      {loading && (
        <Pending>
          Consultando a leitura complementar. Os resultados diretos já
          disponíveis foram preservados.
        </Pending>
      )}
      {(error ||
        report?.syncUnavailable ||
        report?.syncState === 'setup_pending' ||
        (!loading && !report?.connected)) && (
        <Card>
          <SectionTitle
            title="Situação da leitura complementar"
            action={
              <Badge tone="warn">
                {report?.fetchedAt ? 'Cópia salva' : 'Aguardando atualização'}
              </Badge>
            }
          />
          <p className="text-sm text-ink-2">
            {error
              ? 'O Reportei não respondeu nesta consulta. As conexões diretas acima continuam disponíveis.'
              : report?.message ||
                'O Reportei ainda não dispõe de uma atualização automática para este recorte. Os números diretos acima vêm das contas de anúncios.'}
          </p>
          {report?.fetchedAt && (
            <p className="text-xs text-ink-2 mt-2">
              Última leitura: {timestamp(report.fetchedAt)} · horário de
              Brasília.
            </p>
          )}
          {report?.lastAvailablePeriod && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="soft"
                onClick={() => onHistory(report.lastAvailablePeriod)}
              >
                Consultar histórico de{' '}
                {day(report.lastAvailablePeriod.startDate)} a{' '}
                {day(report.lastAvailablePeriod.endDate)}
              </Button>
              <p className="text-xs text-ink-2 mt-2">
                Ao abrir o histórico, todas as abas passam a usar essas datas. A
                cópia salva não é apresentada como dado atual.
              </p>
            </div>
          )}
          <InternalSettingsLink />
        </Card>
      )}
      <Card>
        <SectionTitle
          title="Conferir as duas leituras"
          detail="Conexão direta e Reportei são leituras complementares. Elas não são somadas nem substituídas silenciosamente."
          action={
            <Button
              size="sm"
              variant="soft"
              onClick={() => setDetails((v) => !v)}
            >
              {details ? 'Recolher detalhes' : 'Ver métricas por fonte'}
            </Button>
          }
        />
        {report?.fetchedAt && (
          <p className="text-xs text-ink-2 mb-3">
            Reportei consultado em {timestamp(report.fetchedAt)}
            {report.stale ? ' · cópia antiga' : ''}.
          </p>
        )}
        {details ? (
          groups.map((group, index) => {
            const rows = compareObservedMetrics(
              group.direct ? nativeObservedMetrics(group.direct) : [],
              group.other?.metrics || [],
            )
            return (
              <div
                className="mt-5 first:mt-0"
                key={`${group.platform}:${group.accountId}:${index}`}
              >
                <h3 className="text-sm font-semibold text-ink">
                  {sourceLabel(group.platform)} ·{' '}
                  {group.other?.accountName || group.accountId}
                </h3>
                {group.other?.error && (
                  <p className="text-xs text-ink-2 mt-2">{group.other.error}</p>
                )}
                {rows.length ? (
                  <DataTable
                    caption={`Leituras de ${sourceLabel(group.platform)}`}
                    columns={[
                      {
                        key: 'label',
                        label: 'Informação',
                        render: (r) => (
                          <span>
                            {r.label}
                            <span className="block text-xs text-ink-2 font-normal mt-1 max-w-sm">
                              {r.description}
                            </span>
                          </span>
                        ),
                      },
                      {
                        key: 'native',
                        label: 'Direto',
                        render: (r) =>
                          r.native?.status === 'available'
                            ? ['spend', 'crm_won_value'].includes(r.key)
                              ? money(r.native.value)
                              : count(r.native.value)
                            : '—',
                      },
                      {
                        key: 'reportei',
                        label: 'Reportei',
                        render: (r) =>
                          r.reportei?.status === 'available'
                            ? ['spend', 'crm_won_value'].includes(r.key)
                              ? money(r.reportei.value)
                              : count(r.reportei.value)
                            : '—',
                      },
                      {
                        key: 'status',
                        label: 'Conferência',
                        render: (r) => (
                          <span className="text-xs">
                            {r.status === 'aligned'
                              ? 'Leituras coincidem'
                              : r.status === 'different'
                                ? 'Conferir atualização e atribuição'
                                : 'Informação complementar'}
                          </span>
                        ),
                      },
                    ]}
                    rows={rows}
                  />
                ) : (
                  <p className="text-xs text-ink-2 mt-2">
                    Sem leitura disponível neste recorte.
                  </p>
                )}
              </div>
            )
          })
        ) : (
          <p className="text-sm text-ink-2">
            Abra os detalhes para ver cada métrica, sua definição e eventuais
            diferenças entre as fontes.
          </p>
        )}
      </Card>
    </div>
  )
}
