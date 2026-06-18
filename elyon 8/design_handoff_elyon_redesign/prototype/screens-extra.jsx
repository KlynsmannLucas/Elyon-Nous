/* ELYON NOUS — blocos novos (audiências, alocador, auditoria, estratégia, memória, portal) */
const { useState: useStateX } = React;

const recTone = (r) => ({ 'escalar': 'good', 'manter': 'blue', 'testar': 'warn', 'cortar': 'bad', 'Escalar': 'good', 'Otimizar': 'blue', 'Reduzir': 'bad' }[r] || 'neutral');

/* ═══ AUDIÊNCIAS ═════════════════════════════════════════════════════════ */
function Audiencias({ mode }) {
  const D = window.DATA;
  const am = D.audienceMatrix;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card hover>
        <SectionHead title="Públicos ativos" sub="Performance e recomendação do NOUS" icon="users"
          right={<SourceBadge kind="real" />} />
        <DataTable cols={[
          { label: 'Público', bold: true, render: r => (
            <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.type} · {r.size}</div></div>) },
          { label: 'ROAS', align: 'right', mono: true, render: r => <span style={{ color: r.roas >= 3 ? 'var(--green-600)' : 'var(--amber)', fontWeight: 600 }}>{r.roas.toFixed(1)}x</span> },
          { label: 'CPA', align: 'right', mono: true, render: r => D.fmt.brlc(r.cpa) },
          { label: 'Share', align: 'right', mono: true, render: r => r.share + '%' },
          { label: 'NOUS', align: 'center', render: r => <Badge tone={recTone(r.status)} dot>{r.status}</Badge> },
        ]} rows={D.audiences} />
      </Card>
      <div className="split">
        <Card hover>
          <SectionHead title="Conversão por idade e gênero" sub="Onde está seu cliente" icon="chart" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 4 }}>
            {am.ages.map((a, i) => {
              const max = Math.max(...am.male, ...am.female);
              return (
                <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', width: 44, flexShrink: 0 }}>{a}</span>
                  <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: `${am.male[i] / max * 100}%`, height: 16, background: 'var(--dv-1)', borderRadius: '4px 0 0 4px', minWidth: 3 }} title={`Homens ${am.male[i]}%`} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ width: `${am.female[i] / max * 100}%`, height: 16, background: 'var(--dv-3)', borderRadius: '0 4px 4px 0', minWidth: 3 }} title={`Mulheres ${am.female[i]}%`} />
                    </div>
                  </div>
                </div>
              );
            })}
            <Legend items={[{ label: 'Homens', color: 'var(--dv-1)' }, { label: 'Mulheres', color: 'var(--dv-3)' }]} />
          </div>
        </Card>
        <Card hover style={{ background: 'var(--blue-soft)', borderColor: 'var(--blue-line)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <NousOrb size={36} />
            <div>
              <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 5 }}>Recomendação de públicos</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink)' }}>
                Escale <b>Remarketing 30d</b> e <b>Lookalike 1%</b> (ROAS acima de 4,5x) e corte o <b>público amplo frio</b> (ROAS 1,6x). Realocar essa verba deve render <b style={{ color: 'var(--green-600)' }}>+R$ 18,4 mil</b>/mês.
              </div>
              <Button size="sm" variant="primary" icon="bolt" style={{ marginTop: 12 }} onClick={() => window.toast && window.toast({ tone: 'good', title: 'Recomendação aplicada', body: 'Ganho estimado: +R$ 18,4 mil/mês' })}>Aplicar recomendação</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══ ALOCADOR DE VERBA (IA) ═════════════════════════════════════════════ */
function AlocadorIA({ mode }) {
  const D = window.DATA, al = D.allocator;
  const [applied, setApplied] = useStateX(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ background: 'linear-gradient(110deg, var(--blue-soft), var(--green-soft))', borderColor: 'var(--blue-line)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <NousOrb size={42} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 4 }}>Alocador de verba · NOUS IA</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Realocação ótima mantendo o mesmo orçamento total.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Ganho projetado</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-600)' }}>+{D.fmt.brl(al.projectedGain)}</div>
          </div>
          <Button variant={applied ? 'green' : 'primary'} icon={applied ? 'check' : 'bolt'} onClick={() => { setApplied(true); window.toast && window.toast({ tone: 'good', title: 'Alocação aplicada', body: `Ganho projetado: +${D.fmt.brl(al.projectedGain)}` }); }}>{applied ? 'Aplicado' : 'Aplicar alocação'}</Button>
        </div>
      </Card>
      <Card hover>
        <SectionHead title="Atual → Sugerido" sub={`Orçamento total ${D.fmt.brl(al.totalBudget)}`} icon="scale" right={<SourceBadge kind="ai" />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
          {al.rows.map(r => {
            const delta = r.sug - r.cur;
            const maxV = Math.max(...al.rows.map(x => Math.max(x.cur, x.sug)));
            return (
              <div key={r.ch}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: r.color }} />{r.ch}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{D.fmt.brl(r.cur)}</span>
                    <Icon name="arrowR" size={13} style={{ color: 'var(--ink-4)' }} />
                    <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{D.fmt.brl(r.sug)}</span>
                    <Delta v={delta / r.cur * 100} good={delta >= 0 ? 'up' : 'down'} size={11} />
                  </span>
                </div>
                <div style={{ position: 'relative', height: 8, background: 'var(--canvas-2)', borderRadius: 99 }}>
                  <div style={{ position: 'absolute', left: 0, height: '100%', width: `${r.cur / maxV * 100}%`, background: r.color, opacity: 0.35, borderRadius: 99 }} />
                  <div style={{ position: 'absolute', left: 0, height: '100%', width: `${r.sug / maxV * 100}%`, background: r.color, borderRadius: 99, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: 'var(--ink-3)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 8, borderRadius: 99, background: 'var(--ink-4)', opacity: .5 }} /> Atual</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 8, borderRadius: 99, background: 'var(--blue)' }} /> Sugerido pelo NOUS</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══ DRILL-DOWN DE CAMPANHA ═════════════════════════════════════════════ */
function CampanhaDetalhe({ selected, onBack }) {
  const D = window.DATA;
  const tpl = D.campaignDetail;
  // Merge static template with selected row to show the actually clicked campaign
  const c = selected
    ? { ...tpl, name: selected.name, channel: selected.channel,
        objective: selected.name.toLowerCase().includes('lead') ? 'Geração de leads' : selected.name.toLowerCase().includes('view') ? 'Visualizações' : 'Conversões',
        learning: selected.status === 'ativa' ? 'Otimizado' : selected.status === 'atenção' ? 'Aprendizado' : 'Limitado' }
    : tpl;
  const learnTone = c.learning === 'Otimizado' ? 'good' : c.learning === 'Aprendizado' ? 'warn' : 'bad';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start' }}>
        <Icon name="chevL" size={16} /> Voltar para campanhas
      </button>
      <Card hover>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <ChannelMark name={c.channel} size={32} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em' }}>{c.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Objetivo: {c.objective}</div>
          </div>
          <Badge tone={learnTone} dot>Fase: {c.learning}</Badge>
          <Badge tone="neutral">Pixel {c.pixel.match}% match</Badge>
        </div>
      </Card>
      <div className="split">
        <Card hover>
          <SectionHead title="ROAS por objetivo" icon="target" />
          <Bars h={180} yFmt={v => (v / 100).toFixed(1) + 'x'} data={c.byObjective.map((o, i) => ({ label: o.obj, value: Math.round(o.roas * 100), color: ['var(--dv-1)', 'var(--dv-3)', 'var(--dv-4)'][i] }))} />
        </Card>
        <Card hover>
          <SectionHead title="Posicionamentos" sub="Distribuição de entrega" icon="layers" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Donut size={130} thickness={18} centerTop="Feed" centerSub="TOP" data={c.placements.map(p => ({ value: p.share, color: p.color }))} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {c.placements.map(p => (
                <div key={p.p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color }} /><span style={{ flex: 1 }}>{p.p}</span>
                  <span className="mono" style={{ color: 'var(--ink-2)' }}>{p.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Card hover>
        <SectionHead title="Conjuntos de anúncios (ad sets)" icon="grid" />
        <DataTable cols={[
          { label: 'Ad set', k: 'name', bold: true },
          { label: 'Investimento', align: 'right', mono: true, render: r => D.fmt.brl(r.spend) },
          { label: 'ROAS', align: 'right', mono: true, render: r => <span style={{ color: r.roas >= 3 ? 'var(--green-600)' : 'var(--amber)', fontWeight: 600 }}>{r.roas.toFixed(1)}x</span> },
          { label: 'Fase', align: 'center', render: r => <Badge tone={r.status === 'Otimizado' ? 'good' : 'warn'} dot>{r.status}</Badge> },
        ]} rows={c.adsets} />
      </Card>
      <div className="split">
        <Card hover>
          <SectionHead title="Geografia" sub="Top estados por share" icon="map" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {c.geo.map(g => (
              <div key={g.uf} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, width: 50, flexShrink: 0 }}>{g.uf}</span>
                <div style={{ flex: 1 }}><ProgressBar pct={g.share} color="var(--dv-1)" h={7} /></div>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)', width: 38, textAlign: 'right' }}>{g.share}%</span>
                <span className="mono" style={{ fontSize: 11.5, color: g.roas >= 3 ? 'var(--green-600)' : 'var(--amber)', width: 36, textAlign: 'right', fontWeight: 600 }}>{g.roas.toFixed(1)}x</span>
              </div>
            ))}
          </div>
        </Card>
        <Card hover>
          <SectionHead title="Saúde do pixel & tracking" icon="pulse" right={<SourceBadge kind="real" />} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Eventos capturados (7d)', D.fmt.int(c.pixel.events)], ['Match rate', c.pixel.match + '%'], ['Deduplicação', c.pixel.dedup]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--ink-2)' }}>{k}</span><span className="mono" style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--line-2)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: 'var(--green-600)' }}><Icon name="check" size={15} /> Tracking saudável — dados confiáveis para otimização</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══ AUDITORIA PROFUNDA (11 dimensões) — bloco p/ Diagnóstico ═══════════ */
function AuditBlock() {
  const D = window.DATA, a = D.audit;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="split-wide">
        <Card hover>
          <SectionHead title="Auditoria profunda · 11 dimensões" sub={`Última: ${a.date}`} icon="search"
            right={<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><SourceBadge kind="real" /><Button size="sm" variant="ghost" icon="download">PDF</Button></div>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 9 }}>
            {a.dimensions.map((d, i) => {
              const t = TONES[d.s];
              return (
                <div key={i} style={{ padding: '10px 12px', border: `1px solid ${t.b}`, background: t.bg, borderRadius: 'var(--r-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>{d.k}</span>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: t.c }}>{d.v}</span>
                  </div>
                  <div style={{ marginTop: 6 }}><ProgressBar pct={d.v} color={t.c} h={4} track="rgba(255,255,255,.6)" /></div>
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card hover style={{ textAlign: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Nota da auditoria</div>
            <div className="mono" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: '-.03em', color: 'var(--green-600)' }}>{a.grade}</div>
            <div style={{ margintop: 6, fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>Score {a.score}/100</div>
            <div style={{ marginTop: 12 }}><Sparkline data={a.evolution} color="var(--green)" h={36} /></div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>Evolução vs. auditorias anteriores · <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>+{a.score - a.prevScore} pts</span></div>
          </Card>
        </div>
      </div>
      <div className="split">
        <Card hover>
          <SectionHead title="Desperdício de verba" sub="Onde o dinheiro está vazando" icon="money" right={<span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>−{D.fmt.brl(a.waste.total)}</span>} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {a.waste.items.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--red-soft)', border: '1px solid #F3CFCC', borderRadius: 'var(--r-sm)' }}>
                <span style={{ color: 'var(--red)', flexShrink: 0 }}><Icon name="alert" size={15} /></span>
                <span style={{ flex: 1, fontSize: 12.5 }}>{w.what}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>−{D.fmt.brl(w.value)}</span>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card hover>
            <SectionHead title="Checklist de tracking" icon="check" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {a.tracking.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: t.ok ? 'var(--green-soft)' : 'var(--red-soft)', color: t.ok ? 'var(--green-600)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={t.ok ? 'check' : 'alert'} size={12} w={2.6} />
                  </span>
                  <span style={{ color: t.ok ? 'var(--ink-2)' : 'var(--ink)' }}>{t.k}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card hover style={{ background: 'var(--canvas)', borderColor: 'var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>G</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Segunda opinião · {a.secondOpinion.engine}</span>
              <Badge tone="good" style={{ marginLeft: 'auto' }}>{a.secondOpinion.agree}% concorda</Badge>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{a.secondOpinion.note}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══ ESTRATÉGIA (90 dias) — bloco p/ Plano de Ação ═════════════════════ */
function EstrategiaBlock() {
  const D = window.DATA, s = D.strategy;
  const quad = [
    { k: 'escalar', t: 'Escalar', tone: 'good', icon: 'arrowUp' },
    { k: 'corrigir', t: 'Corrigir', tone: 'warn', icon: 'pulse' },
    { k: 'testar', t: 'Testar', tone: 'blue', icon: 'spark' },
    { k: 'cortar', t: 'Cortar', tone: 'bad', icon: 'alert' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ background: 'linear-gradient(110deg, var(--blue-soft), var(--green-soft))', borderColor: 'var(--blue-line)' }}>
        <div style={{ display: 'flex', gap: 13 }}>
          <NousOrb size={40} />
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 4 }}>Tese de crescimento · 90 dias</div>
            <div style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.6 }}>{s.thesis}</div>
          </div>
        </div>
      </Card>

      <Card hover>
        <SectionHead title="Matriz estratégica" sub="Decisão por iniciativa" icon="grid" />
        <div className="split">
          {quad.map(q => {
            const t = TONES[q.tone];
            return (
              <div key={q.k} style={{ background: t.bg, border: `1px solid ${t.b}`, borderRadius: 'var(--r-md)', padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11, color: t.c, fontWeight: 700, fontSize: 14 }}><Icon name={q.icon} size={16} />{q.t}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {s.matrix[q.k].map((x, i) => <div key={i} style={{ fontSize: 12.5, color: 'var(--ink-2)', display: 'flex', gap: 7 }}><span style={{ color: t.c }}>•</span>{x}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="split-wide">
        <Card hover>
          <SectionHead title="Persona-alvo" sub="Gerada pelo NOUS a partir dos seus dados" icon="users" right={<SourceBadge kind="ai" />} />
          <div style={{ display: 'flex', gap: 16 }}>
            <Avatar initials="M" size={56} tone="linear-gradient(135deg, var(--dv-3), var(--dv-2))" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{s.persona.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, marginTop: 4 }}>{s.persona.summary}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            {[['Idade', s.persona.age], ['Gênero', s.persona.gender], ['Renda', s.persona.income], ['Regiões', s.persona.regions.join(' · ')]].map(([k, v]) => (
              <div key={k} style={{ padding: '9px 11px', background: 'var(--canvas)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                <div className="eyebrow" style={{ marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Interesses</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {s.persona.interests.map(i => <Badge key={i} tone="blue">{i}</Badge>)}
            </div>
          </div>
        </Card>
        <Card hover>
          <SectionHead title="Ranking de canais" sub="Onde investir" icon="layers" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {s.channelRanking.map((c, i) => (
              <div key={c.ch}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <span className="mono" style={{ color: 'var(--ink-4)' }}>{i + 1}</span>{c.ch}
                  </span>
                  <Badge tone={recTone(c.rec)}>{c.rec}</Badge>
                </div>
                <ProgressBar pct={c.score} color={c.score >= 80 ? 'var(--green)' : c.score >= 60 ? 'var(--blue)' : 'var(--red)'} h={7} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card hover>
        <SectionHead title="Plano 7 / 30 / 90 dias" icon="calendar" />
        <div className="cols-3">
          {[['7 dias', s.plan.d7, 'var(--dv-1)'], ['30 dias', s.plan.d30, 'var(--dv-3)'], ['90 dias', s.plan.d90, 'var(--dv-2)']].map(([t, items, c]) => (
            <div key={t}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>{t}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {items.map((x, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, padding: '10px 12px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', fontSize: 12.5 }}>
                    <span style={{ color: c, flexShrink: 0 }}><Icon name="check" size={14} w={2.4} /></span>{x}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══ MEMÓRIA VIVA (RAG) ═════════════════════════════════════════════════ */
function MemoriaBlock() {
  const D = window.DATA;
  return (
    <Card hover>
      <SectionHead title="Memória viva do NOUS" sub="Padrões aprendidos com o histórico deste cliente" icon="brain" right={<SourceBadge kind="ai" />} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {D.memory.map((m, i) => {
          const t = TONES[m.tone];
          return (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 13px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', borderLeft: `3px solid ${t.c}` }}>
              <span style={{ color: t.c, flexShrink: 0, marginTop: 1 }}><Icon name="spark" size={15} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.pattern}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{m.evidence}</div>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>{m.date}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ═══ PORTAL DO CLIENTE — bloco p/ Relatórios ═══════════════════════════ */
function PortalBlock() {
  const D = window.DATA, p = D.portal;
  const [copied, setCopied] = useStateX(false);
  return (
    <Card hover>
      <SectionHead title="Portal do cliente" sub="Compartilhe resultados por link, sem login" icon="share"
        right={<Badge tone="good" dot>Ativo</Badge>} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 8px 8px 14px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', marginBottom: 14 }}>
        <Icon name="link" size={15} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
        <span className="mono" style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.link}</span>
        <Button size="sm" variant={copied ? 'green' : 'soft'} icon={copied ? 'check' : 'copy'} onClick={() => { setCopied(true); try { navigator.clipboard && navigator.clipboard.writeText(p.link); } catch(e){} window.toast && window.toast({ tone: 'good', title: 'Link copiado', body: p.link }); setTimeout(() => setCopied(false), 1500); }}>{copied ? 'Copiado' : 'Copiar'}</Button>
      </div>
      <div style={{ display: 'flex', gap: 18, marginBottom: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
        <span><b style={{ color: 'var(--ink)' }}>{p.visits}</b> visitas</span>
        <span>último acesso <b style={{ color: 'var(--ink)' }}>{p.lastViewed}</b></span>
      </div>
      <div className="eyebrow" style={{ marginBottom: 9 }}>Seções visíveis para o cliente</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {p.sections.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
            <span style={{ fontSize: 13 }}>{s.k}</span>
            <ToggleSwitch on={s.on} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══ PERSONA DO CLIENTE — bloco p/ Plano de Ação ═══════════════════════ */
const PERSONA_ROLES = [
  { k: 'gestor',  icon: 'target',    title: 'Gestor de Tráfego',     desc: 'Interesses do Facebook Ads prontos para segmentar' },
  { k: 'social',  icon: 'megaphone', title: 'Social Media',          desc: 'Ângulos de conteúdo e linguagem editorial' },
  { k: 'creator', icon: 'bolt',      title: 'Influencer / Creator',  desc: 'Roteiros e ganchos que geram identificação' },
  { k: 'dono',    icon: 'building',  title: 'Dono do Negócio',       desc: 'Visão estratégica e proposta de valor' },
];

/* Saída específica por papel */
function PersonaDeliverable({ role, p }) {
  if (role === 'gestor') {
    const interests = ['Educação financeira', 'Investimentos', 'Nubank', 'Empreendedorismo', 'XP Investimentos', 'Crédito pessoal', 'Serasa', 'PicPay', 'Finanças pessoais'];
    return (
      <Card hover>
        <SectionHead title="Interesses para o Facebook Ads" sub="Prontos para colar no Gerenciador de Anúncios" icon="target" right={<SourceBadge kind="ai" />} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {interests.map(i => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--blue-600)', background: 'var(--blue-soft)', border: '1px solid var(--blue-line)', borderRadius: 'var(--r-pill)', padding: '6px 12px' }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--blue)' }} />{i}
            </span>
          ))}
        </div>
        <div className="cols-3">
          {[['Alcance estimado', '2,4–3,1 mi', 'SP · RJ · BH'], ['Público frio', 'LAL 1% Compradores', 'recomendado'], ['Sobreposição', 'Baixa', 'pronto para subir']].map(([l, v, s]) => (
            <div key={l} style={{ padding: '11px 13px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
              <div className="eyebrow" style={{ marginBottom: 5 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  if (role === 'social') {
    const angles = [
      ['Educar', 'Mitos sobre crédito que custam caro', 'Posicione-se como quem simplifica o complicado.'],
      ['Prova social', 'Histórias de quem organizou as contas', 'Depoimentos reais reduzem a desconfiança.'],
      ['Urgência', 'Condições que mudam todo mês', 'Crie escassez honesta com prazos reais.'],
      ['Bastidores', 'Como avaliamos cada proposta', 'Transparência gera autoridade.'],
    ];
    return (
      <Card hover>
        <SectionHead title="Ângulos de conteúdo & tom de voz" sub="Para guiar a linha editorial" icon="megaphone" right={<SourceBadge kind="ai" />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {angles.map(([tag, t, d]) => (
            <div key={t} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', alignItems: 'flex-start' }}>
              <Badge tone="blue" style={{ flexShrink: 0, marginTop: 1 }}>{tag}</Badge>
              <div><div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.5 }}>{d}</div></div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', background: 'var(--green-soft)', border: '1px solid var(--green-line)', borderRadius: 'var(--r-sm)' }}>
          <Icon name="spark" size={15} style={{ color: 'var(--green-600)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}><b style={{ color: 'var(--ink)' }}>Tom de voz:</b> próximo, claro e sem jargão — fala como amigo que entende de dinheiro.</span>
        </div>
      </Card>
    );
  }
  if (role === 'creator') {
    const hooks = [
      ['Gancho de abertura', '"Ninguém te conta isso sobre crédito…"', '3s para prender a atenção'],
      ['Roteiro · problema → virada', 'Mostre a dor (contas bagunçadas) → a virada (1 parcela só)', 'Ideal para Reels de 30–45s'],
      ['CTA nativo', '"Comenta ORGANIZAR que eu te mando o passo a passo"', 'Gera conversa e alcance'],
    ];
    return (
      <Card hover>
        <SectionHead title="Roteiros & ganchos" sub="Que geram identificação com a persona" icon="bolt" right={<SourceBadge kind="ai" />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hooks.map(([tag, t, s], i) => (
            <div key={i} style={{ padding: '13px 15px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>{tag}</div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{t}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 5 }}>{s}</div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  // dono
  const pillars = [['Proposta de valor', 'Crédito sem letras miúdas, aprovado na hora e que cabe no bolso.'], ['Diferencial', 'Transparência total + simulação em 2 minutos, 100% online.'], ['Promessa', 'Sair do vermelho com uma parcela só — sem burocracia.']];
  return (
    <Card hover>
      <SectionHead title="Visão estratégica & proposta de valor" sub="Para alinhar posicionamento e oferta" icon="building" right={<SourceBadge kind="ai" />} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pillars.map(([l, v]) => (
          <div key={l} style={{ display: 'flex', gap: 12, padding: '13px 15px', background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'var(--blue-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={16} w={2.4} /></span>
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>{l}</div><div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.55 }}>{v}</div></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PersonaBlock() {
  const D = window.DATA, p = D.strategy.persona;
  const [role, setRole] = useStateX('gestor');
  const [stage, setStage] = useStateX('idle'); // idle · loading · done
  const cur = PERSONA_ROLES.find(r => r.k === role);
  const learned = ['Crédito & Fintech · público nacional', 'Objetivo principal: geração de leads', 'Ticket médio R$ 2.200 · margem 38%', 'Meta Ads e Google Ads conectados'];

  const generate = () => {
    setStage('loading');
    setTimeout(() => { setStage('done'); window.toast && window.toast({ tone: 'good', title: 'Persona gerada', body: `Perfil para ${cur.title} pronto.` }); }, 1400);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.025em', margin: 0 }}>Persona do Cliente</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '5px 0 0', lineHeight: 1.6, maxWidth: 680 }}>O NOUS cria o perfil do cliente ideal — dores, desejos, objeções e segmentações — a partir dos dados reais do seu negócio, adaptado para quem vai usar.</p>
      </div>

      {/* Seletor de papel */}
      <Card>
        <div className="eyebrow" style={{ marginBottom: 13 }}>Você vai usar como</div>
        <div className="split">
          {PERSONA_ROLES.map(r => {
            const on = role === r.k;
            return (
              <button key={r.k} onClick={() => { setRole(r.k); setStage('idle'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '14px 15px', borderRadius: 'var(--r-md)', cursor: 'pointer', transition: 'all .15s',
                  background: on ? 'var(--blue-soft)' : 'var(--paper)', border: `1px solid ${on ? 'var(--blue)' : 'var(--line)'}`, boxShadow: on ? 'none' : 'var(--sh-1)' }}>
                <span style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: on ? 'var(--blue)' : 'var(--canvas-2)', color: on ? '#fff' : 'var(--ink-2)' }}><Icon name={r.icon} size={19} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: on ? 'var(--blue-600)' : 'var(--ink)' }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.4 }}>{r.desc}</div>
                </div>
                <span style={{ width: 20, height: 20, borderRadius: 99, flexShrink: 0, border: `2px solid ${on ? 'var(--blue)' : 'var(--line-strong)'}`, background: on ? 'var(--blue)' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon name="check" size={12} w={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 14 }}>
          <Button variant="primary" icon="sparkle2" full size="lg" onClick={generate} disabled={stage === 'loading'}>
            {stage === 'loading' ? 'Gerando persona…' : stage === 'done' ? `Regenerar para ${cur.title}` : `Gerar persona para ${cur.title}`}
          </Button>
        </div>
      </Card>

      {/* Confiabilidade + o que aprendemos */}
      <div className="split">
        <Card hover>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Confiabilidade da persona</span>
            <span><span className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>43%</span> <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>dados reais</span></span>
          </div>
          <div style={{ display: 'flex', height: 9, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: '43%', background: 'var(--green)' }} />
            <div style={{ width: '57%', background: 'var(--amber)' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--ink-2)' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--green)' }} />43% dados confirmados</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--ink-2)' }}><span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--amber)' }} />57% inferência estratégica</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>Combina dados reais das contas conectadas com inferências estratégicas da IA. Conecte mais fontes para aumentar a confiabilidade.</div>
        </Card>
        <Card hover style={{ background: 'var(--green-soft)', borderColor: 'var(--green-line)' }}>
          <div className="eyebrow" style={{ color: 'var(--green-600)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="check" size={14} /> O que aprendemos com seus dados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {learned.map(l => (
              <div key={l} style={{ display: 'flex', gap: 9, fontSize: 13, color: 'var(--ink)', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--green-600)', flexShrink: 0, marginTop: 1 }}><Icon name="check" size={14} w={2.4} /></span>{l}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Estado: loading */}
      {stage === 'loading' && (
        <Card style={{ textAlign: 'center', padding: '40px 24px' }} className="fade-in">
          <NousOrb size={50} thinking />
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>O NOUS está montando a persona…</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 5 }}>Cruzando seus dados com benchmarks do nicho para {cur.title}.</div>
        </Card>
      )}

      {/* Estado: resultado */}
      {stage === 'done' && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Perfil base */}
          <Card hover>
            <SectionHead title="Perfil da persona" sub={`Adaptado para ${cur.title}`} icon="users" right={<Badge tone="blue" dot>{cur.title}</Badge>} />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Avatar initials="M" size={56} tone="linear-gradient(135deg, var(--dv-3), var(--dv-2))" />
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, marginTop: 4 }}>{p.summary}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
              {[['Idade', p.age], ['Gênero', p.gender], ['Renda', p.income], ['Regiões', p.regions.join(' · ')]].map(([k, v]) => (
                <div key={k} style={{ padding: '10px 12px', background: 'var(--canvas)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                  <div className="eyebrow" style={{ marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          {/* Saída específica do papel */}
          <PersonaDeliverable role={role} p={p} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Audiencias, AlocadorIA, CampanhaDetalhe, AuditBlock, EstrategiaBlock, MemoriaBlock, PortalBlock, PersonaBlock });
