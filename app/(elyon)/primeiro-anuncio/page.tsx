// app/(elyon)/primeiro-anuncio/page.tsx — "Meu Primeiro Anúncio" (iniciantes).
// Tela própria (full-screen, sem o shell) que gera um anúncio pronto + passo a
// passo para quem nunca anunciou. Aditiva e isolada — não toca em fluxos existentes.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { Icon, Card, Button } from '@/components/dashboard/v2'

const brl = (n: number) => 'R$ ' + new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { try { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); if (typeof window !== 'undefined') window.toast?.({ tone: 'good', title: 'Copiado!' }) } catch {} }}
      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue hover:underline shrink-0">
      <Icon name={done ? 'check' : 'clipboard'} size={13} /> {done ? 'Copiado' : 'Copiar'}
    </button>
  )
}

export default function PrimeiroAnuncioPage() {
  const router = useRouter()
  const clientData = useAppStore(s => s.clientData)
  const savedClients = useAppStore(s => s.savedClients)
  const connectedAccounts = useAppStore(s => s.connectedAccounts)
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<'intro' | 'loading' | 'result' | 'error'>('intro')
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState('')
  const [openAdvanced, setOpenAdvanced] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const key = clientData?.clientName || savedClients?.[0]?.clientData?.clientName || ''
  const cd: any = clientData || savedClients?.[0]?.clientData
  const hasMeta = connectedAccounts.some(a => a.platform === 'meta')

  const generate = async () => {
    setPhase('loading'); setErr('')
    try {
      const res = await fetch('/api/first-ad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: key, niche: cd?.niche, objective: cd?.objective, city: cd?.city,
          products: (cd?.products || []).join(', '), budget: cd?.budget,
          mainPains: cd?.mainPains, mainObjection: cd?.mainObjection,
        }),
      })
      const d = await res.json()
      if (!res.ok || d.error) { setErr(d.error || 'Falha ao gerar.'); setPhase('error'); return }
      setData(d); setPhase('result')
    } catch { setErr('Falha de conexão. Tente novamente.'); setPhase('error') }
  }

  const Header = (
    <header className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-paper">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue flex items-center justify-center"><span className="text-white text-base font-bold">E</span></div>
        <div>
          <div className="text-[15px] font-bold text-ink leading-none">Elyon</div>
          <div className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-ink-3 mt-1">Meu primeiro anúncio</div>
        </div>
      </div>
      <button onClick={() => router.push('/hoje')} className="text-[13px] font-medium text-ink-3 hover:text-ink transition-colors">Voltar</button>
    </header>
  )

  if (!key) {
    return (
      <div className="min-h-screen flex flex-col">{Header}
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md text-center"><div className="py-6">
            <div className="w-14 h-14 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4"><Icon name="rocket" size={24} /></div>
            <h2 className="text-lg font-semibold text-ink mb-2">Primeiro, crie seu negócio</h2>
            <p className="text-sm text-ink-2 mb-5">Preciso conhecer seu negócio para montar o anúncio. Leva 2 minutos.</p>
            <Button onClick={() => router.push('/novo')}>Criar meu negócio</Button>
          </div></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">{Header}
      <div className="flex-1 px-4 py-6 md:py-8">
        <div className="w-full max-w-2xl mx-auto">

          {phase === 'intro' && (
            <div className="text-center animate-fade-up">
              <div className="w-16 h-16 rounded-2xl bg-blue flex items-center justify-center mx-auto mb-5"><Icon name="rocket" size={28} /></div>
              <h1 className="text-[26px] font-bold text-ink mb-2" style={{ letterSpacing: '-0.02em' }}>Vamos criar seu primeiro anúncio</h1>
              <p className="text-[15px] text-ink-2 max-w-lg mx-auto mb-1">Com base no seu negócio ({cd?.niche}), o NOUS monta um anúncio <strong>pronto para publicar</strong> — texto, ideia de imagem, quem mirar, quanto investir — e te ensina a colocar no ar, mesmo que você nunca tenha anunciado.</p>
              <p className="text-[12px] text-ink-3 mb-6">Sem precisar conectar nada. Custa 2 créditos.</p>
              <Button onClick={generate} icon={<Icon name="spark" size={16} />}>Gerar meu primeiro anúncio</Button>
            </div>
          )}

          {phase === 'loading' && (
            <div className="text-center py-16 animate-fade-up">
              <div className="w-14 h-14 rounded-full bg-blue-soft flex items-center justify-center mx-auto mb-4 animate-pulse"><Icon name="spark" size={24} /></div>
              <p className="text-ink font-semibold">Montando seu anúncio…</p>
              <p className="text-sm text-ink-3 mt-1">O NOUS está escrevendo o texto e escolhendo o público.</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center py-16 animate-fade-up">
              <div className="w-14 h-14 rounded-full bg-red-soft flex items-center justify-center mx-auto mb-4"><Icon name="alert" size={24} /></div>
              <p className="text-ink font-semibold mb-1">Não consegui gerar agora</p>
              <p className="text-sm text-ink-2 mb-4">{err}</p>
              <Button onClick={generate}>Tentar novamente</Button>
            </div>
          )}

          {phase === 'result' && data && (
            <div className="space-y-4 animate-fade-up">
              <div className="text-center mb-1">
                <h1 className="text-[22px] font-bold text-ink" style={{ letterSpacing: '-0.02em' }}>Seu primeiro anúncio está pronto 🎉</h1>
                <p className="text-[13px] text-ink-3">Copie cada parte e siga o passo a passo no fim.</p>
              </div>

              {/* Plataforma */}
              <Card>
                <div className="flex items-start gap-2.5">
                  <Icon name="megaphone" size={18} />
                  <div><div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-0.5">Onde anunciar</div>
                    <div className="text-sm font-semibold text-ink">{data.platform.name}</div>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">{data.platform.why}</p></div>
                </div>
              </Card>

              {/* O anúncio */}
              <Card>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">✍️ O anúncio (copie e cole)</div>
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-canvas-2">
                    <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-semibold text-ink-3">Título</span><CopyBtn text={data.ad.headline} /></div>
                    <div className="text-sm font-semibold text-ink">{data.ad.headline}</div>
                  </div>
                  <div className="p-3 rounded-md bg-canvas-2">
                    <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-semibold text-ink-3">Texto principal</span><CopyBtn text={data.ad.primaryText} /></div>
                    <div className="text-[13.5px] text-ink whitespace-pre-wrap leading-relaxed">{data.ad.primaryText}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-canvas-2"><div className="text-[11px] font-semibold text-ink-3 mb-1">Botão (CTA)</div><div className="text-sm font-semibold text-ink">{data.ad.cta}</div></div>
                    <div className="p-3 rounded-md bg-blue-soft border border-blue-line"><div className="text-[11px] font-semibold text-blue mb-1">📸 Ideia de imagem/vídeo</div><div className="text-[12.5px] text-ink-2 leading-relaxed">{data.ad.creativeIdea}</div></div>
                  </div>
                </div>
              </Card>

              {/* Público + Orçamento */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">🎯 Quem mirar</div>
                  <div className="space-y-1.5 text-[13px]">
                    <div><span className="text-ink-3">Idade:</span> <span className="text-ink font-medium">{data.targeting.age}</span></div>
                    <div><span className="text-ink-3">Local:</span> <span className="text-ink font-medium">{data.targeting.location}</span></div>
                    <div className="flex flex-wrap gap-1.5 pt-1">{data.targeting.interests.map((i: string, k: number) => <span key={k} className="text-[11px] px-2 py-0.5 rounded-pill bg-canvas-2 text-ink-2">{i}</span>)}</div>
                    <p className="text-[11.5px] text-ink-3 pt-1">{data.targeting.note}</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">💰 Quanto investir</div>
                  <div className="text-[22px] font-bold font-mono text-ink">{brl(data.budget.dailyBRL)}<span className="text-[13px] text-ink-3 font-semibold">/dia</span></div>
                  <p className="text-[12.5px] text-ink-2 mt-0.5">Por {data.budget.durationDays} dias = <strong>{brl(data.budget.totalBRL)}</strong> para começar e aprender.</p>
                  <p className="text-[12px] text-ink-3 mt-1.5">Estimativa: <strong className="text-ink">{data.budget.leadsMin}–{data.budget.leadsMax} contatos</strong> (CPL típico do nicho {data.budget.cplRange}).</p>
                </Card>
              </div>

              {/* Como publicar */}
              <Card>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">🪜 Como colocar no ar</div>
                <div className="rounded-md border border-blue-line bg-blue-soft p-3">
                  <div className="text-sm font-semibold text-ink mb-2">{data.howToPublish.easy.title}</div>
                  <ol className="space-y-1.5">
                    {data.howToPublish.easy.steps.map((s: string, k: number) => (
                      <li key={k} className="flex gap-2 text-[12.5px] text-ink-2"><span className="w-4 h-4 rounded-full bg-blue text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{k + 1}</span>{s}</li>
                    ))}
                  </ol>
                </div>
                <button onClick={() => setOpenAdvanced(v => !v)} className="text-[12px] font-semibold text-ink-3 hover:text-ink mt-3 inline-flex items-center gap-1">
                  <Icon name={openAdvanced ? 'chevD' : 'chevR'} size={13} /> {data.howToPublish.advanced.title}
                </button>
                {openAdvanced && (
                  <ol className="space-y-1.5 mt-2 pl-1">
                    {data.howToPublish.advanced.steps.map((s: string, k: number) => (
                      <li key={k} className="flex gap-2 text-[12.5px] text-ink-2"><span className="w-4 h-4 rounded-full bg-canvas-2 border border-line text-ink-3 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{k + 1}</span>{s}</li>
                    ))}
                  </ol>
                )}
              </Card>

              {/* Dicas */}
              {data.tips?.length > 0 && (
                <Card>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">🧠 Dicas de quem entende</div>
                  <ul className="space-y-1.5">{data.tips.map((t: string, k: number) => <li key={k} className="flex gap-2 text-[12.5px] text-ink-2"><span className="text-green-600 mt-0.5">✓</span>{t}</li>)}</ul>
                </Card>
              )}

              {/* Próximo passo */}
              <Card className="bg-gradient-to-br from-blue-soft to-paper border-blue-line">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-sm font-bold text-ink">Próximo passo: deixe o Elyon cuidar disso pra você</div>
                    <p className="text-[12.5px] text-ink-2 mt-0.5">{hasMeta ? 'Sua conta Meta já está conectada — rode a Análise Profunda para o NOUS acompanhar e otimizar.' : 'Conecte sua conta Meta e o NOUS passa a acompanhar os resultados, avisar o que ajustar e escalar o que funciona.'}</p>
                  </div>
                  <Button variant="soft" onClick={() => router.push(hasMeta ? '/diagnostico' : '/integracoes')}>{hasMeta ? 'Rodar análise' : 'Conectar Meta'}</Button>
                </div>
              </Card>

              <div className="flex justify-center gap-2 pt-1">
                <Button variant="soft" onClick={generate} icon={<Icon name="spark" size={14} />}>Gerar outra versão</Button>
                <Button variant="soft" onClick={() => router.push('/hoje')}>Concluir</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
