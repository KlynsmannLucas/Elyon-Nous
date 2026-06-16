/* ELYON NOUS — Diagnóstico, Mercado, Plano, Relatórios, Integrações, Config */
const { useState: useStateM } = React;

/* NOUS hypothesis banner */
function NousBanner({ title, children, cta, onCta }) {
  return (
    <Card style={{ background: 'linear-gradient(110deg, var(--blue-soft), var(--green-soft))', borderColor: 'var(--blue-line)' }}>
      <div style={{ display: 'flex', gap: 13 }}>
        <NousOrb size={40} />
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: 'var(--blue-600)', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.6 }}>{children}</div>
          {cta && <Button size="sm" variant="primary" style={{ marginTop: 12 }} onClick={onCta} iconRight="arrowR">{cta}</Button>}
        </div>
      </div>
    </Card>
  );
}

/* ── DIAGNÓSTICO ────────────────────────────────────────────────────────── */
function Diagnostico({ mode, onNav }) {
  const D = window.DATA, dg = D.diagnosis, h = D.health;
  const [dtab, setDtab] = useStateM('geral');
  const swotMap = [
    { k: 'forcas', t: 'Forças', tone: 'good', icon: 'check' },
    { k: 'fraquezas', t: 'Fraquezas', tone: 'bad', icon: 'alert' },
    { k: 'oportunidades', t: 'Oportunidades', tone: 'blue', icon: 'spark' },
    { k: 'ameacas', t: 'Ameaças', tone: 'warn', icon: 'flag' },
  ];
  return (
    <div>
      <SubTabs value={dtab} onChange={setDtab} tabs={[{ k: 'geral', label: 'Visão geral', icon: 'pulse' }, { k: 'auditoria', label: 'Auditoria profunda', icon: 'search' }]} />
      {dtab === 'auditoria' ? <div className="fade-in"><AuditBlock /></div> : (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NousBanner title="Hipótese do NOUS" cta="Ver plano recomendado" onCta={() => onNav('plano')}>
        O baixo volume de leads qualificados está limitando as oportunidades de fundo de funil. Corrigir a conversão pode gerar
        <b style={{ color: 'var(--green-600)' }}> +R$ 73 mil</b> em receita nos próximos 30 dias.
      </NousBanner>

      <div className="split">
        <Card hover>
          <SectionHead title="Maturidade por pilar" sub="Sua operação × benchmark do setor" icon="pulse"
            right={<Legend items={[{ label: 'Você', color: 'var(--blue)' }, { label: 'Setor', color: 'var(--ink-4)' }]} />} />
          <Radar h={280} axes={h.pillars} bench={[78, 72, 70, 75, 66, 60]} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="split">
            <Card hover style={{ textAlign: 'center' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Saúde geral</div>
              <Gauge value={h.score} size={120} tone="var(--green)" sub="SAUDÁVEL" />
            </Card>
            <Card hover>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Maior gargalo</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.2 }}>{dg.bottleneck.stage}</div>
              <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-2)' }}>Conversão atual</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>{dg.bottleneck.conv} <span style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 12 }}>vs {dg.bottleneck.bench} setor</span></div>
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--red-soft)', borderRadius: 'var(--r-xs)' }}>
                <span className="eyebrow" style={{ color: 'var(--red)' }}>Impacto estimado</span>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>−{D.fmt.brl(dg.bottleneck.impact)}</div>
              </div>
            </Card>
          </div>
          <Card hover>
            <SectionHead title="Diagnóstico de causas-raiz" icon="search" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {dg.causes.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: c.sev === 'alta' ? 'var(--red)' : 'var(--amber)', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{c.text}</span>
                  <Badge tone={c.sev === 'alta' ? 'bad' : 'warn'}>{c.sev}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card hover>
        <SectionHead title="Análise SWOT" sub="Gerada pelo NOUS a partir dos seus dados" icon="layers" />
        <div className="split">
          {swotMap.map(s => {
            const t = TONES[s.tone];
            return (
              <div key={s.k} style={{ background: t.bg, border: `1px solid ${t.b}`, borderRadius: 'var(--r-md)', padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: t.c, fontWeight: 600, fontSize: 13.5 }}>
                  <Icon name={s.icon} size={16} />{s.t}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dg.swot[s.k].map((x, i) => <div key={i} style={{ fontSize: 12.5, color: 'var(--ink-2)', display: 'flex', gap: 7 }}><span style={{ color: t.c }}>•</span>{x}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      </div>
      )}
    </div>
  );
}

/* ── MERCADO ────────────────────────────────────────────────────────────── */
function Mercado({ mode }) {
  const D = window.DATA, mk = D.market;
  const maxSov = Math.max(...mk.competitors.map(c => c.sov));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="cols-3">
        <Card hover>
          <SectionHead title="Demanda do mercado" sub="Índice · seu nicho" icon="globe" right={<Delta v={mk.demand.delta} good="up" />} />
          <div className="mono" style={{ fontSize: 30, fontWeight: 700 }}>{mk.demand.value}</div>
          <Sparkline data={mk.demand.series} color="var(--green)" h={40} />
        </Card>
        {mk.bench.map(b => (
          <Card key={b.k} hover>
            <SectionHead title={b.k} sub="você × mercado" right={<Delta v={b.delta} good={b.good ? 'down' : 'up'} />} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{b.you}</span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>vs {b.mkt}</span>
            </div>
            <div style={{ marginTop: 10 }}><Badge tone={b.good ? 'good' : 'warn'}>{b.good ? 'Melhor que o mercado' : 'Acima do mercado'}</Badge></div>
          </Card>
        ))}
      </div>

      <div className="split-wide">
        <Card hover>
          <SectionHead title="Share of Voice" sub="Presença competitiva no mercado" icon="users" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mk.competitors.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: c.you ? 700 : 500, color: c.you ? 'var(--blue-600)' : 'var(--ink)' }}>
                    {c.name}{c.you && <Badge tone="blue" style={{ marginLeft: 8 }}>Você</Badge>}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.sov}%</span>
                    <Delta v={c.d} good="up" size={11} />
                  </span>
                </div>
                <ProgressBar pct={(c.sov / maxSov) * 100} color={c.you ? 'var(--blue)' : 'var(--ink-4)'} h={8} />
              </div>
            ))}
          </div>
        </Card>
        <Card hover>
          <SectionHead title="Oportunidades de mercado" sub="Segmentos com maior potencial" icon="spark" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {mk.opps.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>CPL estimado {o.cpl} · entrada {o.ease}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: 'var(--green-600)' }}>+{o.growth}%</div>
                  <div className="eyebrow">crescimento</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── PLANO DE AÇÃO ──────────────────────────────────────────────────────── */
function ImpactEffortMatrix({ actions }) {
  const [ref, w] = useWidth();
  const W = w || 420, h = 260, pad = 34;
  const ex = { Baixo: 0.22, Médio: 0.55, Alto: 0.85 };
  const pts = actions.map((a, i) => {
    const maxImp = Math.max(...actions.map(x => x.impact));
    return { x: pad + ex[a.effort] * (W - pad * 2), y: pad + (1 - a.impact / maxImp) * (h - pad * 2), a, i };
  });
  return (
    <div ref={ref} style={{ width: '100%' }}>
      {W > 0 && (
        <svg width={W} height={h} style={{ display: 'block', overflow: 'visible' }}>
          <line x1={pad} y1={h - pad} x2={W - pad} y2={h - pad} stroke="var(--line)" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="var(--line)" />
          <text x={W / 2} y={h - 6} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)" fontFamily="var(--mono)">ESFORÇO →</text>
          <text x={10} y={h / 2} textAnchor="middle" fontSize="10.5" fill="var(--ink-3)" fontFamily="var(--mono)" transform={`rotate(-90 12 ${h / 2})`}>IMPACTO →</text>
          <text x={pad + 6} y={pad + 4} fontSize="10" fill="var(--green-600)" fontWeight="700" fontFamily="var(--mono)">GANHOS RÁPIDOS</text>
          {pts.map(p => (
            <g key={p.i} style={{ animation: `scaleIn .4s ease ${p.i * 0.07}s both` }}>
              <circle cx={p.x} cy={p.y} r="15" fill="var(--blue)" fillOpacity="0.12" />
              <circle cx={p.x} cy={p.y} r="10" fill="var(--blue)" />
              <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="var(--mono)">{p.i + 1}</text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}

function PlanoAcao({ mode, onNav }) {
  const D = window.DATA;
  const [done, setDone] = useStateM({});
  const cols = [
    { key: 'planejado', label: 'Planejado', items: D.actions.slice(0, 2) },
    { key: 'andamento', label: 'Em andamento', items: D.actions.slice(2, 4) },
    { key: 'concluido', label: 'Concluído', items: D.actions.slice(4, 5) },
  ];
  const totalImpact = D.actions.reduce((a, x) => a + x.impact, 0);
  const [ptab, setPtab] = useStateM('plano');
  return (
    <div>
      <SubTabs value={ptab} onChange={setPtab} tabs={[{ k: 'plano', label: 'Execução', icon: 'check' }, { k: 'estrategia', label: 'Estratégia 90 dias', icon: 'rocket' }]} />
      {ptab === 'estrategia' ? <div className="fade-in"><EstrategiaBlock /></div> : (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="auto-kpi">
        {[['Ações planejadas', D.actions.length, 'check', 'var(--blue)'], ['Em andamento', 2, 'pulse', 'var(--amber)'],
          ['Concluídas', 1, 'trophy', 'var(--green)'], ['Impacto total', '+' + D.fmt.brl(totalImpact), 'bolt', 'var(--green)']].map(([l, v, ic, c], i) => (
          <Card key={i} hover pad={15}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--canvas-2)', color: c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={17} /></span>
              <div><div className="eyebrow">{l}</div><div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{v}</div></div>
            </div>
          </Card>
        ))}
      </div>

      {mode === 'simple' ? (
        <Card hover>
          <SectionHead title="O que fazer agora" sub="Marque conforme for concluindo" icon="check" />
          <div>
            {D.actions.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--line-2)' }}>
                <button onClick={() => setDone(s => {
                  const wasOff = !s[a.id];
                  if (wasOff) window.toast && window.toast({ tone: 'good', title: 'Ação concluída', body: `+${D.fmt.brl(a.impact)} de impacto estimado.` });
                  return { ...s, [a.id]: !s[a.id] };
                })}
                  style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, border: `2px solid ${done[a.id] ? 'var(--green)' : 'var(--line-strong)'}`,
                    background: done[a.id] ? 'var(--green)' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done[a.id] && <Icon name="check" size={14} w={3} />}
                </button>
                <div style={{ flex: 1, opacity: done[a.id] ? 0.5 : 1, textDecoration: done[a.id] ? 'line-through' : 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{a.why}</div>
                </div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-600)' }}>+{D.fmt.brl(a.impact)}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <>
          <div className="cols-3">
            {cols.map(col => (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{col.label}</span>
                  <Badge tone="neutral">{col.items.length}</Badge>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.items.map(a => (
                    <Card key={a.id} hover pad={13}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 7, lineHeight: 1.3 }}>{a.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Badge tone={a.urgency === 'alta' ? 'bad' : a.urgency === 'média' ? 'warn' : 'neutral'}>{a.channel}</Badge>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-600)' }}>+{D.fmt.brl(a.impact)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="split">
            <Card hover>
              <SectionHead title="Matriz impacto × esforço" sub="Priorize os ganhos rápidos" icon="target" />
              <ImpactEffortMatrix actions={D.actions} />
            </Card>
            <Card hover>
              <SectionHead title="Roadmap · próximos 90 dias" icon="calendar" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                {[['Otimização de CPA', 18, 'var(--dv-1)', '0%'], ['Escalar remarketing', 32, 'var(--dv-2)', '15%'], ['Novos criativos', 45, 'var(--dv-3)', '35%'], ['Testes de público', 60, 'var(--dv-4)', '55%']].map(([l, wpct, c, off], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 12.5, marginBottom: 5 }}>{l}</div>
                    <div style={{ position: 'relative', height: 10, background: 'var(--canvas-2)', borderRadius: 99 }}>
                      <div style={{ position: 'absolute', left: off, width: wpct + '%', height: '100%', background: c, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2 }} className="mono">
                  <span>JUN</span><span>JUL</span><span>AGO</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
      )}
    </div>
  );
}

/* ── RELATÓRIOS ─────────────────────────────────────────────────────────── */
function Relatorios({ mode }) {
  const D = window.DATA;
  const templates = [['Executivo mensal', 'Visão geral de KPIs', 'doc'], ['Performance por canal', 'Detalhado por plataforma', 'layers'], ['ROI & atribuição', 'Modelos de atribuição', 'target'], ['Personalizado', 'Monte do seu jeito', 'spark']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NousBanner title="Resumo sugerido pelo NOUS">
        Seu relatório executivo mostra evolução consistente de receita (+17,6%) e eficiência. Destaque para o ROAS e a redução de CPA no período.
      </NousBanner>
      <div className="split-wide">
        <Card hover>
          <SectionHead title="Receita × investimento" sub="Visão do período" icon="chart"
            right={<Legend items={[{ label: 'Receita', color: 'var(--dv-2)' }, { label: 'Investimento', color: 'var(--dv-1)' }]} />} />
          <LineChart h={230} area labels={D.revenueTrend.labels} yFmt={v => 'R$' + Math.round(v / 1000) + 'k'}
            series={[{ data: D.revenueTrend.receita, color: 'var(--dv-2)' }, { data: D.revenueTrend.investimento, color: 'var(--dv-1)' }]} />
        </Card>
        <Card hover>
          <SectionHead title="Exportar relatório" icon="download" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {[['PDF executivo', 'doc'], ['Excel detalhado', 'layers'], ['Slides para diretoria', 'image'], ['Agendar envio semanal', 'calendar']].map(([l, ic], i) => (
              <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', background: 'var(--paper)', textAlign: 'left', transition: 'all .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue-line)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
                <span style={{ color: 'var(--blue)' }}><Icon name={ic} size={17} /></span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{l}</span>
                <Icon name="arrowR" size={15} style={{ color: 'var(--ink-3)' }} />
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Card hover>
        <SectionHead title="Modelos de relatório" icon="doc" />
        <div className="auto-cards">
          {templates.map(([t, d, ic], i) => (
            <button key={i} style={{ textAlign: 'left', padding: 15, border: '1px solid var(--line)', borderRadius: 'var(--r-md)', background: 'var(--paper)', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-line)'; e.currentTarget.style.boxShadow = 'var(--sh-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--blue-soft)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11 }}><Icon name={ic} size={18} /></span>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{d}</div>
            </button>
          ))}
        </div>
      </Card>
      <PortalBlock />
    </div>
  );
}

/* ── INTEGRAÇÕES ────────────────────────────────────────────────────────── */
function Integracoes({ mode }) {
  const D = window.DATA;
  const [connectOpen, setConnectOpen] = useStateM(false);
  const conns = [
    { p: 'Meta Ads', health: 'Excelente', tone: 'good', sync: 'há 3 min' },
    { p: 'Google Ads', health: 'Excelente', tone: 'good', sync: 'há 5 min' },
    { p: 'TikTok Ads', health: 'Bom', tone: 'good', sync: 'há 8 min' },
    { p: 'LinkedIn Ads', health: 'Bom', tone: 'good', sync: 'há 12 min' },
    { p: 'Google Analytics 4', health: 'Excelente', tone: 'good', sync: 'há 4 min' },
    { p: 'CRM (HubSpot)', health: 'Atenção', tone: 'warn', sync: 'há 1 h' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="cols-3">
        {[['Conectadas', '17', 'good'], ['Saudáveis', '14', 'good'], ['Com atenção', '2', 'warn']].map(([l, v, t], i) => (
          <Card key={i} hover><div className="eyebrow">{l}</div><div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{v}</div></Card>
        ))}
      </div>
      <Card hover>
        <SectionHead title="Plataformas conectadas" sub="Status de sincronização" icon="plug" right={<Button size="sm" variant="primary" icon="plus" onClick={() => setConnectOpen(true)}>Conectar nova</Button>} />
        <DataTable cols={[
          { label: 'Plataforma', bold: true, render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><ChannelMark name={r.p.split(' ')[0]} size={20} />{r.p}</div> },
          { label: 'Status', render: () => <Badge tone="good" dot>Conectado</Badge> },
          { label: 'Saúde', render: r => <Badge tone={r.tone}>{r.health}</Badge> },
          { label: 'Sincronização', align: 'right', mono: true, render: r => r.sync },
        ]} rows={conns} />
      </Card>
      <Modal open={connectOpen} onClose={() => setConnectOpen(false)} icon="plug" title="Conectar nova plataforma" sub="Escolha a fonte de dados que deseja conectar via OAuth" width={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { p: 'Meta Ads', d: 'Facebook & Instagram', m: 'Meta' },
            { p: 'Google Ads', d: 'Search, Display, PMax', m: 'Google' },
            { p: 'TikTok Ads', d: 'Vertical video ads', m: 'TikTok' },
            { p: 'LinkedIn Ads', d: 'B2B & Lead Gen', m: 'LinkedIn' },
            { p: 'Google Analytics 4', d: 'Métricas de site', m: 'Google' },
            { p: 'HubSpot', d: 'CRM & marketing', m: 'Outros' },
          ].map(opt => (
            <button key={opt.p} onClick={() => { setConnectOpen(false); window.toast && window.toast({ tone: 'blue', title: 'Abrindo autorização', body: `Redirecionando para ${opt.p}…` }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 13, border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', background: 'var(--paper)', textAlign: 'left', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-line)'; e.currentTarget.style.boxShadow = 'var(--sh-2)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <ChannelMark name={opt.m} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{opt.p}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{opt.d}</div>
              </div>
              <Icon name="arrowR" size={15} style={{ color: 'var(--ink-3)' }} />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/* ── CONFIG ─────────────────────────────────────────────────────────────── */
function Config({ mode, onNav }) {
  const D = window.DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div className="split">
      <Card hover>
        <SectionHead title="Workspace" sub="Dados da empresa" icon="building" />
        {[['Nome', D.company.name], ['Segmento', D.company.niche], ['Setor', D.company.sector], ['Fuso horário', 'GMT-03 · Brasília'], ['Moeda', 'BRL (R$)']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--line-2)', fontSize: 13.5 }}>
            <span style={{ color: 'var(--ink-3)' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <Button variant="ghost" full style={{ marginTop: 14 }} icon="gear">Editar informações</Button>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card hover>
          <SectionHead title="Preferências do NOUS" sub="Como a IA trabalha pra você" icon="sparkle2" />
          {[['Briefing diário', true], ['Alertas proativos', true], ['Sugestões de ação', true], ['Relatório semanal automático', false]].map(([l, on], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--line-2)' }}>
              <span style={{ fontSize: 13.5 }}>{l}</span>
              <ToggleSwitch on={on} onChange={(nv) => window.toast && window.toast({ tone: nv ? 'good' : 'neutral', title: `${l}: ${nv ? 'ativado' : 'desativado'}` })} />
            </div>
          ))}
        </Card>
        <Card hover>
          <SectionHead title="Plano" icon="trophy" right={<Button size="sm" variant="soft" onClick={() => onNav && onNav('planos')} iconRight="arrowR">Ver planos</Button>} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>Enterprise</div><div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>R$ 2.997/mês · inteligência contínua</div></div>
            <Badge tone="good" dot>Ativo</Badge>
          </div>
        </Card>
      </div>
    </div>
    <MemoriaBlock />
    </div>
  );
}

function ToggleSwitch({ on: initial, onChange }) {
  const [on, setOn] = useStateM(initial);
  const toggle = () => { const nv = !on; setOn(nv); onChange && onChange(nv); };
  return (
    <button onClick={toggle} style={{ width: 40, height: 23, borderRadius: 99, border: 'none', padding: 2,
      background: on ? 'var(--blue)' : 'var(--line-strong)', transition: 'background .2s', position: 'relative' }}>
      <span style={{ display: 'block', width: 19, height: 19, borderRadius: 99, background: '#fff', transform: on ? 'translateX(17px)' : 'translateX(0)', transition: 'transform .2s', boxShadow: 'var(--sh-1)' }} />
    </button>
  );
}

Object.assign(window, { Diagnostico, Mercado, PlanoAcao, Relatorios, Integracoes, Config, NousBanner, ToggleSwitch });
