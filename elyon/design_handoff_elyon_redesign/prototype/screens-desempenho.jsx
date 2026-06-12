/* ELYON NOUS — Desempenho (performance) -------------------------------- */
const { useState: useStateD } = React;

/* Sub-tabs bar */
function SubTabs({ tabs, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 18, overflowX: 'auto' }} className="no-sb">
      {tabs.map(t => {
        const active = t.k === value;
        return (
          <button key={t.k} onClick={() => onChange(t.k)}
            style={{ padding: '10px 14px', fontSize: 13.5, fontWeight: active ? 600 : 500, border: 'none', background: 'none',
              color: active ? 'var(--ink)' : 'var(--ink-3)', borderBottom: `2px solid ${active ? 'var(--blue)' : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'all .15s' }}>
            {t.icon && <Icon name={t.icon} size={15} />}{t.label}
          </button>
        );
      })}
    </div>
  );
}

/* Legend */
function Legend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: it.color }} />{it.label}
        </span>
      ))}
    </div>
  );
}

/* Data table */
function DataTable({ cols, rows, onRow }) {
  return (
    <div style={{ overflowX: 'auto' }} className="no-sb">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i} style={{ textAlign: c.align || 'left', padding: '9px 12px', fontSize: 10.5, fontWeight: 600, letterSpacing: '.06em',
                textTransform: 'uppercase', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', fontFamily: 'var(--mono)' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} onClick={onRow ? () => onRow(r, ri) : undefined} style={{ transition: 'background .12s', cursor: onRow ? 'pointer' : 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--canvas)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {cols.map((c, ci) => (
                <td key={ci} style={{ textAlign: c.align || 'left', padding: '11px 12px', borderBottom: '1px solid var(--line-2)', whiteSpace: 'nowrap',
                  fontFamily: c.mono ? 'var(--mono)' : 'inherit', fontWeight: c.bold ? 600 : 'inherit' }}>{c.render ? c.render(r) : r[c.k]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function chColor(name) {
  const m = { Meta: 'var(--dv-1)', Google: 'var(--dv-2)', TikTok: 'var(--dv-3)', LinkedIn: 'var(--dv-4)' };
  return m[name] || 'var(--dv-6)';
}
function StatusBadge({ s }) {
  return <Badge tone={s === 'ativa' ? 'good' : s === 'atenção' ? 'warn' : 'neutral'} dot>{s}</Badge>;
}

/* ── Sub-views ──────────────────────────────────────────────────────────── */
function VisaoGeral({ mode }) {
  const D = window.DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="auto-kpi">
        {D.kpis.map((k, i) => <div key={k.k} className="fade-up" style={{ animationDelay: `${i * 0.03}s` }}><StatCard kpi={k} compact /></div>)}
      </div>
      <div className="split-wide">
        <Card hover>
          <SectionHead title="Tendência de receita × investimento" sub="Últimos 7 dias" icon="chart"
            right={<Legend items={[{ label: 'Receita', color: 'var(--dv-2)' }, { label: 'Investimento', color: 'var(--dv-1)' }]} />} />
          <LineChart h={250} area labels={D.revenueTrend.labels}
            yFmt={(v) => 'R$' + Math.round(v / 1000) + 'k'}
            series={[{ data: D.revenueTrend.receita, color: 'var(--dv-2)' }, { data: D.revenueTrend.investimento, color: 'var(--dv-1)' }]} />
        </Card>
        <Card hover>
          <SectionHead title="Distribuição por canal" sub="Investimento" icon="layers" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Donut size={140} thickness={20} centerTop="R$124k" centerSub="TOTAL"
              data={D.channelMix.map(c => ({ value: c.spend, color: c.color }))} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {D.channelMix.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, flex: 1 }}>{c.name}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{c.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <PerObjective />
    </div>
  );
}

function PerObjective() {
  return (
    <Card hover>
      <SectionHead title="ROAS por canal" sub="Retorno sobre investimento" icon="target" />
      <Bars h={200} yFmt={(v) => (v / 100).toFixed(1) + 'x'}
        data={window.DATA.channelMix.map(c => ({ label: c.name.replace(' Ads', ''), value: Math.round(c.roas * 100), color: c.color }))} />
    </Card>
  );
}

function Campanhas({ mode, onOpen }) {
  const D = window.DATA;
  const cols = [
    { label: 'Campanha', k: 'name', bold: true, render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><ChannelMark name={r.channel} size={20} /><span>{r.name}</span></div>) },
    { label: 'Investimento', align: 'right', mono: true, render: r => D.fmt.brl(r.spend) },
    { label: 'Receita', align: 'right', mono: true, render: r => D.fmt.brl(r.rev) },
    { label: 'Conv.', align: 'right', mono: true, render: r => D.fmt.int(r.conv) },
    { label: 'ROAS', align: 'right', mono: true, render: r => <span style={{ color: r.roas >= 3 ? 'var(--green-600)' : 'var(--amber)', fontWeight: 600 }}>{r.roas.toFixed(2)}x</span> },
    { label: 'CPA', align: 'right', mono: true, render: r => D.fmt.brlc(r.cpa) },
    { label: 'CTR', align: 'right', mono: true, render: r => r.ctr.toFixed(2) + '%' },
    { label: 'Status', align: 'center', render: r => <StatusBadge s={r.status} /> },
    { label: '', align: 'right', render: () => <Icon name="chevR" size={16} style={{ color: 'var(--ink-4)' }} /> },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="auto-kpi">
        {D.kpis.filter(k => ['investimento', 'conversoes', 'cpa', 'roas'].includes(k.k)).map(k => <StatCard key={k.k} kpi={k} compact />)}
      </div>
      <Card hover>
        <SectionHead title="Desempenho por campanha" sub={`${D.campaigns.length} campanhas ativas`} icon="megaphone"
          right={<div style={{ display: 'flex', gap: 8 }}><Button size="sm" variant="ghost" icon="filter">Filtros</Button><Button size="sm" variant="ghost" icon="download">Exportar</Button></div>} />
        <DataTable cols={cols} rows={D.campaigns} onRow={onOpen} />
      </Card>
    </div>
  );
}

function Canais({ mode }) {
  const D = window.DATA;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="auto-cards">
        {D.channelMix.map((c, i) => (
          <Card key={c.name} hover pad={15} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <ChannelMark name={c.name.replace(' Ads', '').replace('Outros', 'Outros')} size={26} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
            </div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{D.fmt.brl(c.spend)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 10 }}>investido</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--ink-3)' }}>ROAS</span>
              <span className="mono" style={{ fontWeight: 600, color: c.roas >= 3 ? 'var(--green-600)' : 'var(--amber)' }}>{c.roas.toFixed(1)}x</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 5 }}>
              <span style={{ color: 'var(--ink-3)' }}>CPA</span>
              <span className="mono" style={{ fontWeight: 600 }}>{D.fmt.brlc(c.cpa)}</span>
            </div>
          </Card>
        ))}
      </div>
      <div className="split">
        <Card hover>
          <SectionHead title="Conversões por canal" icon="chart" />
          <Bars h={210} yFmt={v => D.fmt.int(v)} data={D.channelMix.map(c => ({ label: c.name.replace(' Ads', ''), value: c.conv, color: c.color }))} />
        </Card>
        <Card hover>
          <SectionHead title="Atribuição de receita" sub="Participação nas conversões" icon="layers" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Donut size={150} thickness={20} centerTop="3.402" centerSub="CONV." data={D.channelMix.map(c => ({ value: c.conv, color: c.color }))} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {D.channelMix.map(c => {
                const pct = Math.round(c.conv / D.channelMix.reduce((a, x) => a + x.conv, 0) * 100);
                return (
                  <div key={c.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span>{c.name}</span><span className="mono" style={{ color: 'var(--ink-2)' }}>{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color={c.color} h={6} />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Criativos({ mode }) {
  const D = window.DATA;
  const fatigueCurve = [3.4, 3.3, 3.1, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.8, 1.6, 1.4, 1.2, 1.0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card hover>
        <SectionHead title="Top criativos" sub="O que está funcionando agora" icon="image"
          right={<Button size="sm" variant="soft" icon="sparkle2">Gerar variações</Button>} />
        <div className="auto-cards">
          {D.creatives.map((c, i) => {
            const ft = c.fatigue === 'saudável' ? 'good' : c.fatigue === 'monitorar' ? 'warn' : 'bad';
            return (
              <div key={c.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s`, border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                {/* placeholder creative */}
                <div style={{ height: 120, background: `repeating-linear-gradient(135deg, var(--canvas) 0 10px, var(--canvas-2) 10px 20px)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--line)' }}>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>criativo #{c.id}</span>
                  <span style={{ position: 'absolute', top: 8, right: 8 }}><Badge tone={ft}>{c.fatigue}</Badge></span>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, marginBottom: 9, minHeight: 34 }} className="clamp-2">"{c.hook}"</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div><div className="eyebrow">CTR</div><div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{c.ctr}%</div></div>
                    <div style={{ textAlign: 'right' }}><div className="eyebrow">ROAS</div><div className="mono" style={{ fontWeight: 700, fontSize: 14, color: 'var(--green-600)' }}>{c.roas}x</div></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <div className="split-wide">
        <Card hover>
          <SectionHead title="Curva de fadiga (CTR)" sub="Risco alto previsto em 3 dias" icon="pulse" right={<Badge tone="bad" dot>Atenção</Badge>} />
          <LineChart h={210} labels={Array.from({ length: 14 }, (_, i) => `${i + 1}`)} yFmt={v => v.toFixed(1) + '%'}
            series={[{ data: fatigueCurve.map(v => v * 100), color: 'var(--red)' }]} area />
        </Card>
        <Card hover>
          <SectionHead title="Performance por formato" icon="layers" />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Donut size={140} thickness={18} centerTop="2,71%" centerSub="CTR"
              data={[{ value: 38, color: 'var(--dv-1)' }, { value: 27, color: 'var(--dv-2)' }, { value: 20, color: 'var(--dv-3)' }, { value: 15, color: 'var(--dv-4)' }]} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5 }}>
              {[['Vídeo 9:16', 2.71, 'var(--dv-1)'], ['Vídeo 1:1', 2.34, 'var(--dv-2)'], ['Imagem', 1.82, 'var(--dv-3)'], ['Carrossel', 1.45, 'var(--dv-4)']].map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: c }} /><span style={{ flex: 1 }}>{l}</span>
                  <span className="mono" style={{ color: 'var(--ink-2)' }}>{v}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FunilView({ mode }) {
  const D = window.DATA;
  return (
    <div className="split">
      <Card hover>
        <SectionHead title="Funil de conversão" sub="Da visita ao cliente" icon="funnel" right={<Badge tone="neutral">Conv. 1,01%</Badge>} />
        <Funnel data={D.funnel} h={280} />
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card hover>
          <SectionHead title="Conversão por etapa" icon="chart" />
          <DataTable cols={[
            { label: 'Etapa', k: 'stage', bold: true },
            { label: 'Usuários', align: 'right', mono: true, render: r => D.fmt.int(r.v) },
            { label: '% Total', align: 'right', mono: true, render: r => r.pct + '%' },
            { label: 'Queda', align: 'right', mono: true, render: r => r.drop == null ? '—' : <span style={{ color: 'var(--red)' }}>{r.drop}%</span> },
          ]} rows={D.funnel} />
        </Card>
        <Card hover style={{ background: 'var(--blue-soft)', borderColor: 'var(--blue-line)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <NousOrb size={36} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>Maior gargalo: Leads → Qualificados</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>59,6% dos leads não avançam. Melhorar a qualificação pode gerar <b style={{ color: 'var(--green-600)' }}>+R$ 48,7 mil</b> em 30 dias.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Desempenho composed ────────────────────────────────────────────────── */
function Desempenho({ mode }) {
  const [tab, setTab] = useStateD('geral');
  const [detail, setDetail] = useStateD(false);
  const tabs = [
    { k: 'geral', label: 'Visão geral', icon: 'chart' },
    { k: 'campanhas', label: 'Campanhas', icon: 'megaphone' },
    { k: 'audiencias', label: 'Audiências', icon: 'users' },
    { k: 'canais', label: 'Canais', icon: 'layers' },
    { k: 'criativos', label: 'Criativos', icon: 'image' },
    { k: 'funil', label: 'Funil', icon: 'funnel' },
    { k: 'alocador', label: 'Alocador IA', icon: 'scale' },
  ];
  return (
    <div>
      <SubTabs tabs={tabs} value={tab} onChange={(k) => { setTab(k); setDetail(false); }} />
      <div key={tab + detail} className="fade-in">
        {tab === 'geral' && <VisaoGeral mode={mode} />}
        {tab === 'campanhas' && (detail ? <CampanhaDetalhe onBack={() => setDetail(false)} /> : <Campanhas mode={mode} onOpen={() => setDetail(true)} />)}
        {tab === 'audiencias' && <Audiencias mode={mode} />}
        {tab === 'canais' && <Canais mode={mode} />}
        {tab === 'criativos' && <Criativos mode={mode} />}
        {tab === 'funil' && <FunilView mode={mode} />}
        {tab === 'alocador' && <AlocadorIA mode={mode} />}
      </div>
    </div>
  );
}

Object.assign(window, { Desempenho, SubTabs, Legend, DataTable, StatusBadge });
