'use client'
import { useState } from 'react'
import type { CampaignPlan } from '@/lib/studio/schema'
import { Button } from '@/components/dashboard/v2'
import type { StudioAsset } from './shared'
import StudioPublish from './StudioPublish'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const heading = 'font-semibold text-ink text-sm'
function Copy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="text-xs font-semibold text-blue"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        } catch {
          setCopied(false)
        }
      }}
    >
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}
function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
export default function StudioResult({ job }: { job: any }) {
  const [tab, setTab] = useState('overview'),
    plan: CampaignPlan | undefined = job.plan?.campaign
  if (!plan)
    return job.error ? (
      <p role="alert" className="rounded-lg border border-line p-4 text-sm text-ink-2">
        {job.error}
      </p>
    ) : null
  const tabs = [
    ['overview', 'Visão geral'],
    ...(plan.meta.enabled ? [['meta', 'Meta Ads']] : []),
    ...(plan.google.enabled ? [['google', 'Google Ads']] : []),
    ['creative', 'Artes'],
    ['audience', 'Públicos'],
    ['test', 'Testes e medição'],
  ]
  const exportPlan = () =>
    download(
      `nous-campanha-${job.id.slice(0, 8)}.json`,
      JSON.stringify(
        {
          name: plan.name,
          status: 'DRAFT',
          brief: job.brief,
          ...job.plan,
          assets: (job.assets || []).map((asset: StudioAsset) => ({
            name: asset.name,
            format: asset.format,
            width: asset.width,
            height: asset.height,
          })),
          reviewRequired: true,
        },
        null,
        2,
      ),
      'application/json',
    )
  const exportKeywords = () => {
    // Neutralize spreadsheet formulas. This is a planning worksheet, not an automatic publish request.
    const csv = (value: unknown) =>
      `"${String(value ?? '')
        .replace(/^[=+\-@\t\r]/, "'$&")
        .replace(/"/g, '""')}"`
    const rows = [
      ['Campanha', 'Grupo', 'Palavra-chave', 'Correspondência', 'Negativa', 'Status'],
      ...plan.google.adGroups.flatMap((group) => [
        ...group.keywords.map((keyword) => [
          plan.google.campaignName,
          group.name,
          keyword.text,
          keyword.matchType,
          'Não',
          'Rascunho',
        ]),
        ...group.negativeKeywords.map((keyword) => [
          plan.google.campaignName,
          group.name,
          keyword,
          'PHRASE',
          'Sim',
          'Rascunho',
        ]),
      ]),
    ]
    download(
      'nous-palavras-chave.csv',
      '\uFEFF' + rows.map((row) => row.map(csv).join(';')).join('\r\n'),
      'text/csv;charset=utf-8',
    )
  }
  const current = tabs.some(([key]) => key === tab) ? tab : 'overview'
  return (
    <section className="rounded-xl border border-line bg-paper overflow-hidden">
      <div className="p-5 md:p-6 border-b border-line flex justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-blue uppercase tracking-widest">Rascunho para revisão</p>
          <h2 className="text-xl font-semibold text-ink mt-2">{plan.name}</h2>
          <p className="text-xs text-ink-2 mt-2">
            {job.chargedCredits ?? 0} créditos nesta criação ·{' '}
            {new Date(job.created_at).toLocaleDateString('pt-BR')} · anúncios não publicados
          </p>
        </div>
        <Button variant="soft" onClick={exportPlan}>
          Exportar pacote
        </Button>
      </div>
      <div className="flex gap-1 border-b border-line p-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            aria-pressed={current === key}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm ${current === key ? 'bg-blue-soft text-blue font-semibold' : 'text-ink-2'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-5 md:p-6 space-y-5">
        {job.error && <p className="text-sm bg-amber-50 text-amber-800 rounded-lg p-3">{job.error}</p>}
        {current === 'overview' && (
          <>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{plan.summary}</p>
            <div className="bg-canvas-2 rounded-lg p-4">
              <h3 className={heading}>A proposta da campanha</h3>
              <p className="text-sm text-ink-2 mt-2">{plan.positioning}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                [plan.meta.enabled, 'Meta Ads', plan.meta.dailyBudget],
                [plan.google.enabled, 'Google Ads', plan.google.dailyBudget],
              ]
                .filter(([enabled]) => enabled)
                .map(([, label, value]) => (
                  <div key={String(label)} className="border border-line rounded-lg p-4">
                    <p className="text-xs text-ink-2">{label} · verba diária sugerida</p>
                    <p className="text-xl text-ink font-semibold mt-1">{money(Number(value))}</p>
                  </div>
                ))}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <h3 className={heading}>Fatos usados</h3>
                <ul className="list-disc pl-4 text-sm text-ink-2 space-y-2 mt-3">
                  {plan.confirmedFacts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className={heading}>Antes de anunciar</h3>
                <ul className="list-disc pl-4 text-sm text-ink-2 space-y-2 mt-3">
                  {[...plan.missingInformation, ...plan.warnings].map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                  <li>
                    Confirme conta, localização, conversão, oferta e orçamento no gerenciador antes de ativar.
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
        {current === 'meta' && (
          <>
            <div className="flex justify-between gap-3">
              <div>
                <h3 className={heading}>{plan.meta.campaignName}</h3>
                <p className="text-xs text-ink-2 mt-1">
                  {money(plan.meta.dailyBudget)}/dia ·{' '}
                  {
                    (
                      {
                        OUTCOME_LEADS: 'Cadastros e contatos',
                        OUTCOME_SALES: 'Vendas',
                        OUTCOME_TRAFFIC: 'Tráfego',
                        OUTCOME_ENGAGEMENT: 'Conversas e engajamento',
                      } as any
                    )[plan.meta.objective]
                  }
                </p>
              </div>
              <Copy
                value={plan.meta.ads
                  .map(
                    (ad) =>
                      `${ad.headline}\n\n${ad.primaryText}\n\n${ad.description}\n${job.brief.destinationUrl}`,
                  )
                  .join('\n\n—\n\n')}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {plan.meta.ads.map((ad, i) => (
                <article key={i} className="border border-line rounded-xl p-5">
                  <p className="text-xs uppercase tracking-wide text-blue">
                    Variação {i + 1} · {ad.angle}
                  </p>
                  <p className="text-sm whitespace-pre-line text-ink mt-4 leading-relaxed">
                    {ad.primaryText}
                  </p>
                  <h4 className="font-semibold text-ink mt-4">{ad.headline}</h4>
                  <p className="text-xs text-ink-2 mt-1">{ad.description}</p>
                  <p className="text-xs text-ink-2 mt-4 border-t border-line pt-3">
                    Teste: {ad.testHypothesis}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
        {current === 'google' && (
          <>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h3 className={heading}>{plan.google.campaignName}</h3>
                <p className="text-xs text-ink-2 mt-1">
                  Pesquisa · {money(plan.google.dailyBudget)}/dia · revisar conversões antes de ativar
                </p>
              </div>
              <Button variant="soft" size="sm" onClick={exportKeywords}>
                Baixar palavras-chave
              </Button>
            </div>
            {plan.google.adGroups.map((group, i) => (
              <article key={i} className="border border-line rounded-xl p-5 space-y-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h4 className={heading}>{group.name}</h4>
                    <p className="text-xs text-ink-2 mt-1">{group.reasoning}</p>
                  </div>
                  <Copy value={[...group.headlines, ...group.descriptions].join('\n')} />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-ink">Títulos</p>
                    <div className="mt-2 space-y-1">
                      {group.headlines.map((text, index) => (
                        <p key={index} className="text-sm text-blue flex justify-between gap-3">
                          <span>{text}</span>
                          <span className="text-xs text-ink-2 shrink-0">{text.length}/30</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">Descrições</p>
                    {group.descriptions.map((text, index) => (
                      <p key={index} className="text-sm text-ink-2 mt-2">
                        {text} <span className="text-xs">({text.length}/90)</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">Intenção de compra</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {group.keywords.map((keyword, index) => (
                      <span key={index} className="rounded bg-blue-soft text-blue px-2 py-1 text-xs">
                        {keyword.matchType === 'EXACT' ? `[${keyword.text}]` : `“${keyword.text}”`}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">Negativas sugeridas</p>
                  <p className="text-xs text-ink-2 mt-2">
                    {group.negativeKeywords.join(' · ') || 'Nenhuma sugerida. Revise os termos de pesquisa.'}
                  </p>
                </div>
              </article>
            ))}
            <p className="text-sm text-ink-2">{plan.google.goalNote}</p>
          </>
        )}
        {current === 'creative' && (
          <>
            <p className="text-sm text-ink-2">
              Confira a fidelidade ao produto, textos e identidade da marca. As artes ficam na biblioteca
              deste cliente.
            </p>
            {job.assets?.length ? (
              <div className="grid md:grid-cols-2 gap-5">
                {job.assets.map((asset: StudioAsset) => (
                  <article key={asset.id} className="rounded-xl border border-line overflow-hidden">
                    <div className="bg-canvas-2 h-96 p-4">
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-contain" />
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className={heading}>
                          {asset.format === 'story'
                            ? 'Stories'
                            : asset.format === 'feed'
                              ? 'Feed'
                              : asset.format === 'square'
                                ? 'Quadrado'
                                : 'Horizontal'}
                        </h3>
                        <p className="text-xs text-ink-2 mt-1">
                          {asset.width} × {asset.height}
                        </p>
                      </div>
                      <a className="text-sm font-semibold text-blue" href={`${asset.url}&download=1`}>
                        Baixar PNG ↓
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-6 border border-dashed border-line rounded-lg text-sm text-ink-2">
                {job.brief.mode === 'audience'
                  ? 'Este pacote contém públicos. Você pode criar as artes em uma nova criação.'
                  : 'As artes aparecerão aqui quando estiverem prontas. Se a geração foi interrompida, retome as etapas pendentes.'}
              </div>
            )}
            {plan.creativeBriefs.map((creative, i) => (
              <div key={i} className="bg-canvas-2 rounded-lg p-4">
                <h3 className={heading}>{creative.concept}</h3>
                <p className="text-sm text-ink-2 mt-2">{creative.artDirection}</p>
                <div className="mt-3">
                  <Copy value={creative.imagePrompt} />
                </div>
              </div>
            ))}
          </>
        )}
        {current === 'audience' && (
          <>
            <p className="text-sm text-ink-2">
              Estratégia e hipóteses do agente, acompanhadas das opções que as plataformas conseguiram
              verificar. Nenhum público foi publicado automaticamente.
            </p>
            {plan.meta.enabled &&
              plan.meta.audiences.map((audience, i) => (
                <article key={i} className="rounded-xl border border-line p-4">
                  <div className="flex justify-between gap-3">
                    <h3 className={heading}>{audience.name}</h3>
                    <span className="text-xs text-blue">
                      {
                        { broad: 'Amplo', interests: 'Interesses', remarketing: 'Remarketing' }[
                          audience.strategy
                        ]
                      }
                    </span>
                  </div>
                  <p className="text-sm text-ink-2 mt-2">{audience.reasoning}</p>
                  <p className="text-sm text-ink mt-2">Hipótese: {audience.hypothesis}</p>
                  {!!audience.exclusions.length && (
                    <p className="text-xs text-ink-2 mt-2">
                      Exclusões a revisar: {audience.exclusions.join(' · ')}
                    </p>
                  )}
                </article>
              ))}
            {plan.google.enabled && (
              <div className="rounded-lg bg-canvas-2 p-4">
                <h3 className={heading}>Sinais de intenção para Google</h3>
                <p className="text-sm text-ink-2 mt-2">{plan.google.audienceSignals.join(' · ')}</p>
              </div>
            )}
            {job.plan.targeting?.sources?.map((source: any) => (
              <article key={source.platform} className="border border-line rounded-lg p-4">
                <h3 className={heading}>
                  {source.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}{' '}
                  <span className="font-normal text-xs text-ink-2">
                    ·{' '}
                    {source.status === 'verified'
                      ? 'Opções consultadas'
                      : source.status === 'partial'
                        ? 'Consulta parcial'
                        : 'Verificação pendente'}
                  </span>
                </h3>
                <p className="text-xs text-ink-2 mt-2">{source.message || source.note}</p>
                {source.account && (
                  <p className="text-xs text-ink-2 mt-2">
                    Conta: {source.account.name || source.account.id} · {source.account.currency}
                  </p>
                )}
                {source.locations?.length > 0 && (
                  <p className="text-xs text-ink-2 mt-3">
                    Localizações encontradas, a confirmar:{' '}
                    {source.locations
                      .map(
                        (r: any) =>
                          r.canonicalName || [r.name, r.region, r.country].filter(Boolean).join(', '),
                      )
                      .join(' · ')}
                  </p>
                )}
                {source.interests?.map((group: any) => (
                  <p key={group.query} className="text-sm text-ink-2 mt-3">
                    <strong>{group.query}:</strong>{' '}
                    {group.options.map((r: any) => r.name).join(' · ') || 'Sem correspondência disponível.'}
                  </p>
                ))}
                {!!source.keywords?.length && (
                  <div className="overflow-auto mt-4">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="p-2">Palavra-chave</th>
                          <th className="p-2">Buscas/mês</th>
                          <th className="p-2">Concorrência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {source.keywords.map((r: any, i: number) => (
                          <tr key={i} className="border-b border-line">
                            <td className="p-2">{r.text}</td>
                            <td className="p-2">
                              {r.averageMonthlySearches != null
                                ? Number(r.averageMonthlySearches).toLocaleString('pt-BR')
                                : 'Não informado'}
                            </td>
                            <td className="p-2">
                              {({ LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' } as any)[r.competition] ||
                                'Não informado'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            ))}
          </>
        )}
        {current === 'test' && (
          <>
            <div className="rounded-lg bg-blue-soft p-5">
              <h3 className={heading}>Evento principal: {plan.measurement.primaryEvent}</h3>
              <p className="text-sm text-ink-2 mt-2">{plan.measurement.howToMeasure}</p>
              <p className="text-xs text-ink-2 mt-3">{plan.measurement.attributionNote}</p>
            </div>
            {plan.testPlan.map((test, i) => (
              <article key={i} className="border border-line rounded-lg p-4">
                <h3 className={heading}>
                  Teste {i + 1} · {test.hypothesis}
                </h3>
                <p className="text-sm text-ink-2 mt-2">Mudar: {test.change}</p>
                <p className="text-sm text-ink-2 mt-2">Avaliar: {test.successMetric}</p>
                <p className="text-xs text-ink-2 mt-2">{test.minimumEvidence}</p>
              </article>
            ))}
          </>
        )}
      </div>
      {job.brief.mode === 'campaign' && (
        <div className="p-5 md:p-6 border-t border-line">
          <StudioPublish key={job.id} job={job} />
        </div>
      )}
    </section>
  )
}
